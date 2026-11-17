'use strict'

const express = require('express')
const cors = require('cors')
const { fbAuth } = require('../api/fbAuth')
const { mailboxKey, normalizeEmail } = require('../auth/signInEmail')
const submitRequest = require('./usecases/submitRequest')
const getRequestStatus = require('./usecases/getRequestStatus')
const withdrawRequest = require('./usecases/withdrawRequest')
const getClosures = require('./usecases/getClosures')
const deps = require('./deps')
const {
  guestClientLimiter,
  guestMailboxLimiter,
  guestMailboxDayLimiter
} = require('./adapters/firebaseRateLimiter')
const { isPprGuestRequestsEnabled } = require('./enabled')
const { pprAppOrigins } = require('./deployConfig')
const { clientRateLimitSubject } = require('./clientIp')
const { REQUEST_KEY_PATTERN, pilotInput } = require('./domain/pprRequest')
const { STATUS_TOKEN_PATTERN } = require('./domain/pprStatusLink')

// The PPR routes of sessions without an email address and of nobody:
// submissions without login (where `pprGuestRequests` is on), which need a
// guest session or a login without an email address, the status page the
// pilot's emails link to and the closures the request form shows, which need
// no login. functions/api/index.js mounts them at /ppr only, ahead of the
// permissive CORS of the other routes.
const router = express.Router()

// Pages of the app's dev server (npm start), on the developer's own machine
const DEV_SERVER_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0):\d+$/

// Browsers let only the app's pages call these routes. As the POST routes
// take JSON only, which a page elsewhere cannot post without a preflight, no
// other site can submit requests through its visitors' browsers; scripts
// are stopped by the limits. Preflights from other origins are answered
// here too, without permission. The app may read Retry-After of a 429.
const allowAppOrigins = cors({
  origin: [...pprAppOrigins(), DEV_SERVER_ORIGIN],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Retry-After']
})

function requireJson(req, res, next) {
  if (!req.is('application/json')) {
    return res.status(415).json({ error: 'Content-Type must be application/json' })
  }
  next()
}

// A POST route for the app's pages, with its preflight
function appPost(path, ...handlers) {
  router.route(path)
    .options(allowAppOrigins)
    .post(allowAppOrigins, requireJson, ...handlers)
}

// A GET route for the app's pages. Their GET needs no preflight; the
// preflights of other origins are answered here, without permission.
function appGet(path, ...handlers) {
  router.route(path)
    .options(allowAppOrigins)
    .get(allowAppOrigins, ...handlers)
}

// Requests without login come from the sessions the app starts with its own
// tokens (sign-in provider 'custom'), apart from a login with an email
// address, which requests with it (routes.js): the guest session (started
// with the guest access token, so renewing it stops them) and logins without
// an email address (username/password). All guest sessions share the user
// 'guest', so an email address set on that user must not shut every guest
// out. The kiosk never requests PPR, and sessions of other providers (e.g. a
// password set on the 'guest' user) are not the app's. Runs after fbAuth,
// which rejects missing, invalid and revoked ID tokens.
function requireSessionWithoutEmail(req, res, next) {
  const appSession = req.fbSignInProvider === 'custom'
  const guest = req.fbUserId === 'guest'
  if (!appSession || req.fbUserId === 'kiosk' || (!guest && req.fbUserEmail)) {
    return res.status(403).json({ error: 'Not available to this session' })
  }
  next()
}

// The slots a submission without login holds: one of the limit per client,
// then one of each limit per mailbox. They are given back together when it is
// refused, rejected or fails, as on the route with login. The day comes
// before the hour: when both are used up, the day's wait is the one to tell.
function guestSlots(req, email) {
  const mailbox = mailboxKey(email)
  const limits = [
    [guestClientLimiter, clientRateLimitSubject(req)],
    [guestMailboxDayLimiter, mailbox],
    [guestMailboxLimiter, mailbox]
  ]
  const held = []

  async function release() {
    const releases = held.splice(0).map(([limiter, subject]) => limiter.release(subject).catch(() => undefined))
    await Promise.all(releases)
  }

  // null when all are reserved, otherwise how long to wait (ms) for the
  // limit that is reached
  async function reserve() {
    for (const [limiter, subject] of limits) {
      if (!await limiter.acquire(subject)) {
        await release()
        return limiter.retryAfterMs(subject)
      }
      held.push([limiter, subject])
    }
    return null
  }

  return { reserve, release }
}

// The same answer for every limit: it doesn't tell which one was reached
function tooManyRequests(res, waitMs) {
  res.set('Retry-After', String(Math.max(1, Math.ceil(waitMs / 1000))))
  return res.status(429).json({ error: 'Too many requests' })
}

// POST /guest-requests — a pilot submits a request without login, from a
// guest session or a login without an email address. Nobody confirmed the
// address: the request belongs to no login, is marked for the aerodrome
// (createPprRequest), and the limits bound how many emails the form sends to
// any one address.
async function submitWithoutLogin(req, res) {
  const body = req.body || {}
  // Checked first: the limit per mailbox needs the address
  const email = normalizeEmail(body.email)
  if (email === null) {
    return res.status(400).json({ error: 'Invalid email format' })
  }
  const slots = guestSlots(req, email)
  try {
    const waitMs = await slots.reserve()
    if (waitMs !== null) {
      return tooManyRequests(res, waitMs)
    }
    // { key, status, reviewRemarks?, statusToken, emailSent }
    const result = await submitRequest(deps, { ...pilotInput(body), email, withoutLogin: true })
    res.status(201).json(result)
  } catch (e) {
    await slots.release()
    if (e.code === 'INVALID_INPUT') {
      return res.status(400).json({ error: e.message })
    }
    console.error('Failed to submit PPR request without login')
    res.status(500).json({ error: 'Failed to submit request' })
  }
}

// The key and token of a status link, or null when either cannot be one:
// answered like a wrong token, so the answer doesn't tell which part is
// wrong. The token comes in the body, as request logs record URLs.
function statusLink(req) {
  const { key } = req.params
  const { token } = req.body || {}
  const valid = typeof key === 'string' && REQUEST_KEY_PATTERN.test(key) &&
    typeof token === 'string' && STATUS_TOKEN_PATTERN.test(token)
  return valid ? { key, token } : null
}

function notFound(res) {
  return res.status(404).json({ error: 'Not found' })
}

// POST /status/:key — the status of a request, for its status page
async function showStatus(req, res) {
  const link = statusLink(req)
  if (!link) {
    return notFound(res)
  }
  try {
    res.json(await getRequestStatus(deps, link.key, link.token))
  } catch (e) {
    if (e.code === 'NOT_FOUND') {
      return notFound(res)
    }
    console.error('Failed to read the status of PPR request', link.key)
    res.status(500).json({ error: 'Failed to read status' })
  }
}

// POST /status/:key/withdraw — the pilot withdraws a pending request
async function withdraw(req, res) {
  const link = statusLink(req)
  if (!link) {
    return notFound(res)
  }
  try {
    await withdrawRequest(deps, link.key, link.token)
    res.json({ withdrawn: true })
  } catch (e) {
    if (e.code === 'NOT_FOUND') {
      return notFound(res)
    }
    if (e.code === 'NOT_PENDING') {
      return res.status(409).json({ error: 'Not pending' })
    }
    console.error('Failed to withdraw PPR request', link.key)
    res.status(500).json({ error: 'Failed to withdraw request' })
  }
}

// GET /closures — the closures that haven't ended, for the request form
// with and without login: pilots see the days requests are rejected for
// before they ask. Nothing personal; the rejection tells the same reason to
// anyone who asks for such a day.
async function listClosures(req, res) {
  try {
    res.json({ closures: await getClosures(deps) })
  } catch (e) {
    console.error('Failed to read the PPR closures')
    res.status(500).json({ error: 'Failed to read closures' })
  }
}

// Where requests without login are off, their route does not exist. The
// status and closures routes exist wherever PPR is on: the emails of
// requests made with login link to the status page too, and the form with
// login shows the closures.
if (isPprGuestRequestsEnabled()) {
  appPost('/guest-requests', fbAuth, requireSessionWithoutEmail, submitWithoutLogin)
}
appPost('/status/:key', showStatus)
appPost('/status/:key/withdraw', withdraw)
appGet('/closures', listClosures)

module.exports = router
