'use strict'

const express = require('express')
const { fbAuthExcludingShared, fbAdminAuth } = require('../api/fbAuth')
const submitRequest = require('./usecases/submitRequest')
const reviewRequest = require('./usecases/reviewRequest')
const revokeApproval = require('./usecases/revokeApproval')
const listRequests = require('./usecases/listRequests')
const deleteRequest = require('./usecases/deleteRequest')
const getSettings = require('./usecases/getSettings')
const updateSettings = require('./usecases/updateSettings')
const repository = require('./adapters/firebasePprRepository')
const notifier = require('./adapters/emailNotifier')
const rateLimiter = require('./adapters/firebaseRateLimiter')
const settings = require('./adapters/firebasePprSettings')
const aerodromeStatus = require('./adapters/firebaseAerodromeStatus')

const router = express.Router()
const deps = { repository, notifier, settings, aerodromeStatus }

const FIREBASE_KEY_REGEX = /^[-\w]{1,128}$/

function validateKey(req, res, next) {
  if (!FIREBASE_KEY_REGEX.test(req.params.key)) {
    return res.status(400).json({ error: 'Invalid request key' })
  }
  next()
}

// PPR requests belong to the pilot's email address: the decision is sent
// there and pilots find their own requests by it. Shared guest and kiosk
// sessions are rejected by fbAuthExcludingShared, other logins without an
// email (username/password) by requireEmail.
function requireEmail(req, res, next) {
  if (!req.fbUserEmail) {
    return res.status(403).json({ error: 'PPR requires a login with an email address' })
  }
  next()
}

// POST /requests — pilot submits PPR request
router.post('/requests', fbAuthExcludingShared, requireEmail, async (req, res) => {
  // At most 10 accepted submissions per user and hour (each one emails the
  // aerodrome); rejected ones give their slot back.
  let slotReserved = false
  try {
    slotReserved = await rateLimiter.acquire(req.fbUserId)
    if (!slotReserved) {
      return res.status(429).json({ error: 'Too many requests' })
    }
    const { firstname, lastname, phone, immatriculation,
      aircraftType, mtow, plannedDate, plannedTime, flightType,
      remarks, language } = req.body
    // { key, status, reviewRemarks? }: requests can be answered right away
    const result = await submitRequest(deps, {
      firstname, lastname, phone, immatriculation,
      aircraftType, mtow, plannedDate, plannedTime, flightType,
      remarks, language, email: req.fbUserEmail, createdBy: req.fbUserEmail
    })
    res.status(201).json(result)
  } catch (e) {
    if (slotReserved) {
      await rateLimiter.release(req.fbUserId).catch(() => undefined)
    }
    if (e.code === 'INVALID_INPUT') {
      return res.status(400).json({ error: e.message })
    }
    console.error('Failed to submit PPR request')
    res.status(500).json({ error: 'Failed to submit request' })
  }
})

// GET /requests — the caller's own requests (for admins too)
router.get('/requests', fbAuthExcludingShared, requireEmail, async (req, res) => {
  try {
    const result = await listRequests(deps, {
      email: req.fbUserEmail,
      isAdmin: false
    })
    res.json(result)
  } catch (e) {
    console.error('Failed to list PPR requests')
    res.status(500).json({ error: 'Failed to list requests' })
  }
})

// GET /requests/all — all requests, for the admin list
router.get('/requests/all', fbAdminAuth, async (req, res) => {
  try {
    res.json(await listRequests(deps, { isAdmin: true }))
  } catch (e) {
    console.error('Failed to list all PPR requests')
    res.status(500).json({ error: 'Failed to list requests' })
  }
})

// POST /requests/:key/review — admin approves/rejects
router.post('/requests/:key/review', fbAdminAuth, validateKey, async (req, res) => {
  try {
    await reviewRequest(deps, req.params.key, {
      status: req.body.status,
      reviewedBy: req.fbUserEmail || req.fbUserId,
      reviewedAt: Date.now(),
      reviewRemarks: req.body.remarks
    })
    res.json({ success: true })
  } catch (e) {
    if (e.code === 'NOT_FOUND') {
      return res.status(404).json({ error: 'Request not found' })
    }
    if (e.code === 'INVALID_INPUT') {
      return res.status(400).json({ error: e.message })
    }
    if (e.code === 'NOT_PENDING') {
      return res.status(409).json({ error: e.message })
    }
    console.error('Failed to review PPR request')
    res.status(500).json({ error: 'Failed to review request' })
  }
})

// POST /requests/:key/revoke — admin revokes an approval, with a reason
router.post('/requests/:key/revoke', fbAdminAuth, validateKey, async (req, res) => {
  try {
    await revokeApproval(deps, req.params.key, {
      reviewedBy: req.fbUserEmail || req.fbUserId,
      reviewedAt: Date.now(),
      reviewRemarks: req.body.remarks
    })
    res.json({ success: true })
  } catch (e) {
    if (e.code === 'NOT_FOUND') {
      return res.status(404).json({ error: 'Request not found' })
    }
    if (e.code === 'INVALID_INPUT') {
      return res.status(400).json({ error: e.message })
    }
    if (e.code === 'NOT_APPROVED') {
      return res.status(409).json({ error: e.message })
    }
    console.error('Failed to revoke PPR approval')
    res.status(500).json({ error: 'Failed to revoke approval' })
  }
})

// DELETE /requests/:key — pilot deletes own request
router.delete('/requests/:key', fbAuthExcludingShared, requireEmail, validateKey, async (req, res) => {
  try {
    await deleteRequest(deps, req.params.key, req.fbUserEmail)
    res.json({ success: true })
  } catch (e) {
    if (e.code === 'NOT_FOUND') {
      return res.status(404).json({ error: 'Request not found' })
    }
    if (e.code === 'FORBIDDEN') {
      return res.status(403).json({ error: 'Not authorized' })
    }
    if (e.code === 'NOT_PENDING') {
      return res.status(409).json({ error: e.message })
    }
    console.error('Failed to delete PPR request')
    res.status(500).json({ error: 'Failed to delete request' })
  }
})

// GET /settings — the PPR settings, for the admin area
router.get('/settings', fbAdminAuth, async (req, res) => {
  try {
    res.json(await getSettings(deps))
  } catch (e) {
    console.error('Failed to load PPR settings')
    res.status(500).json({ error: 'Failed to load settings' })
  }
})

// PATCH /settings — admins change the given settings (notification address,
// answer mode, information for pilots and closures in the PPR tab, retention
// in the privacy tab)
router.patch('/settings', fbAdminAuth, async (req, res) => {
  try {
    res.json(await updateSettings(deps, req.body || {}))
  } catch (e) {
    if (e.code === 'INVALID_INPUT') {
      return res.status(400).json({ error: e.message })
    }
    console.error('Failed to save PPR settings')
    res.status(500).json({ error: 'Failed to save settings' })
  }
})

module.exports = router
