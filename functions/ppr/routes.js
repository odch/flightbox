'use strict'

const express = require('express')
const { getDatabase } = require('firebase-admin/database')
const { fbAuthExcludingShared, fbAdminAuth } = require('../api/fbAuth')
const submitRequest = require('./usecases/submitRequest')
const reviewRequest = require('./usecases/reviewRequest')
const listRequests = require('./usecases/listRequests')
const deleteRequest = require('./usecases/deleteRequest')
const repository = require('./adapters/firebasePprRepository')
const notifier = require('./adapters/emailNotifier')
const rateLimiter = require('./adapters/firebaseRateLimiter')

const router = express.Router()
const deps = { repository, notifier }

const FIREBASE_KEY_REGEX = /^[-\w]{1,128}$/

async function loadPprAdminEmail() {
  const snapshot = await getDatabase().ref('/settings/ppr/adminEmail').once('value')
  return snapshot.val()
}

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
    const adminEmail = await loadPprAdminEmail()
    const { firstname, lastname, phone, immatriculation,
      aircraftType, mtow, plannedDate, plannedTime, flightType,
      remarks, language } = req.body
    const result = await submitRequest(deps, {
      firstname, lastname, phone, immatriculation,
      aircraftType, mtow, plannedDate, plannedTime, flightType,
      remarks, language, email: req.fbUserEmail, createdBy: req.fbUserEmail
    }, adminEmail)
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

module.exports = router
