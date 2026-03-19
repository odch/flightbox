'use strict'

const express = require('express')
const admin = require('firebase-admin')
const { fbAuth, fbAdminAuth } = require('../api/fbAuth')
const submitRequest = require('./usecases/submitRequest')
const reviewRequest = require('./usecases/reviewRequest')
const listRequests = require('./usecases/listRequests')
const deleteRequest = require('./usecases/deleteRequest')
const repository = require('./adapters/firebasePprRepository')
const notifier = require('./adapters/emailNotifier')

const router = express.Router()
const deps = { repository, notifier }

const FIREBASE_KEY_REGEX = /^[-\w]{1,128}$/

async function loadPprAdminEmail() {
  const snapshot = await admin.database().ref('/settings/ppr/adminEmail').once('value')
  return snapshot.val()
}

async function checkAdmin(uid) {
  const snapshot = await admin.database().ref(`/admins/${uid}`).once('value')
  return snapshot.val() === true
}

// Rate limiting: per-user submission tracking
const submissionCounts = new Map()
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour
const RATE_LIMIT_MAX = 10

function rateLimit(req, res, next) {
  const uid = req.fbUserId
  const now = Date.now()
  const entry = submissionCounts.get(uid)

  if (entry && now - entry.windowStart < RATE_LIMIT_WINDOW_MS) {
    if (entry.count >= RATE_LIMIT_MAX) {
      return res.status(429).json({ error: 'Too many requests' })
    }
    entry.count++
  } else {
    submissionCounts.set(uid, { windowStart: now, count: 1 })
  }

  next()
}

function validateKey(req, res, next) {
  if (!FIREBASE_KEY_REGEX.test(req.params.key)) {
    return res.status(400).json({ error: 'Invalid request key' })
  }
  next()
}

// POST /requests — pilot submits PPR request
router.post('/requests', fbAuth, rateLimit, async (req, res) => {
  try {
    const adminEmail = await loadPprAdminEmail()
    const { firstname, lastname, phone, immatriculation,
      aircraftType, mtow, plannedDate, plannedTime, flightType,
      remarks } = req.body
    const result = await submitRequest(deps, {
      firstname, lastname, phone, immatriculation,
      aircraftType, mtow, plannedDate, plannedTime, flightType,
      remarks, email: req.fbUserEmail, createdBy: req.fbUserEmail
    }, adminEmail)
    res.status(201).json(result)
  } catch (e) {
    if (e.message.startsWith('Missing required fields') ||
        e.message.startsWith('Invalid email') ||
        e.message.startsWith('Invalid date') ||
        e.message.startsWith('Invalid time') ||
        e.message.startsWith('Invalid mtow') ||
        e.message === 'plannedDate must be today or in the future') {
      return res.status(400).json({ error: e.message })
    }
    console.error('Failed to submit PPR request')
    res.status(500).json({ error: 'Failed to submit request' })
  }
})

// GET /requests — list (admin=all, pilot=own)
router.get('/requests', fbAuth, async (req, res) => {
  try {
    const isAdmin = await checkAdmin(req.fbUserId)
    const result = await listRequests(deps, {
      email: req.fbUserEmail,
      isAdmin
    })
    res.json(result)
  } catch (e) {
    console.error('Failed to list PPR requests')
    res.status(500).json({ error: 'Failed to list requests' })
  }
})

// POST /requests/:key/review — admin approves/rejects
router.post('/requests/:key/review', fbAdminAuth, validateKey, async (req, res) => {
  try {
    await reviewRequest(deps, req.params.key, {
      status: req.body.status,
      reviewedBy: req.fbUserEmail,
      reviewedAt: Date.now(),
      reviewRemarks: req.body.remarks
    })
    res.json({ success: true })
  } catch (e) {
    if (e.code === 'NOT_FOUND') {
      return res.status(404).json({ error: 'Request not found' })
    }
    if (e.message.startsWith('Can only review') ||
        e.message.startsWith('New status must be')) {
      return res.status(400).json({ error: e.message })
    }
    console.error('Failed to review PPR request')
    res.status(500).json({ error: 'Failed to review request' })
  }
})

// DELETE /requests/:key — pilot deletes own request
router.delete('/requests/:key', fbAuth, validateKey, async (req, res) => {
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
    console.error('Failed to delete PPR request')
    res.status(500).json({ error: 'Failed to delete request' })
  }
})

module.exports = router
