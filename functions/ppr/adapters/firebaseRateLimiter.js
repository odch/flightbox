'use strict'

const crypto = require('crypto')
const { getDatabase } = require('firebase-admin/database')

const WINDOW_MS = 60 * 60 * 1000 // 1 hour
const DAY_WINDOW_MS = 24 * WINDOW_MS
const MAX_PER_WINDOW = 10

// Submissions without login, per hour: generous per client, as clubs, mobile
// networks and the aerodrome's Wi-Fi share addresses; tighter per mailbox,
// as each submission emails that address. Per mailbox also per day, like
// the sign-in codes: otherwise a script within the hourly limit could send
// an address a receipt every twelve minutes, day after day.
const GUEST_MAX_PER_CLIENT = 10
const GUEST_MAX_PER_MAILBOX = 5
const GUEST_MAX_PER_MAILBOX_PER_DAY = 10

// uids from Firebase Auth are safe keys; escape anything RTDB keys can't hold
function escapedKey(uid) {
  return encodeURIComponent(uid).replace(/\./g, '%2E')
}

// IP and email addresses are personal data: stored only as a hash, like
// /signInRateLimits and /staticAuthRateLimits
function hashedKey(subject) {
  return crypto.createHash('sha256').update(subject).digest('hex')
}

/**
 * A limit of `maxPerWindow` per subject and fixed window, counted in the
 * database at `path` so it holds across function instances, cold starts and
 * deploys (an in-memory counter would be per instance). Like
 * /signInRateLimits. `keyFor` turns a subject into its database key.
 */
function createRateLimiter({ path, windowMs, maxPerWindow, keyFor }) {
  const limitsRef = () => getDatabase().ref(path)
  const entryRef = subject => limitsRef().child(keyFor(subject))
  const isRunning = (entry, now) => !!entry && now - entry.windowStart < windowMs

  // Reserves a slot atomically; false when the limit is reached.
  async function acquire(subject, now = Date.now()) {
    const { committed } = await entryRef(subject).transaction(current => {
      if (isRunning(current, now)) {
        if (current.count >= maxPerWindow) {
          return undefined // abort: limit reached
        }
        return { windowStart: current.windowStart, count: current.count + 1 }
      }
      return { windowStart: now, count: 1 }
    })
    return committed
  }

  // Gives a reserved slot back, for submissions that were rejected
  async function release(subject) {
    await entryRef(subject).transaction(current => {
      if (!current || !(current.count > 0)) {
        return current
      }
      return { windowStart: current.windowStart, count: current.count - 1 }
    })
  }

  // How long until the running window ends (0 without one), for the
  // Retry-After of a refused submission
  async function retryAfterMs(subject, now = Date.now()) {
    const entry = (await entryRef(subject).once('value')).val()
    return isRunning(entry, now) ? entry.windowStart + windowMs - now : 0
  }

  // Deletes entries whose window has passed (run by the daily cleanup)
  async function pruneExpired(now = Date.now()) {
    const snapshot = await limitsRef().once('value')
    const updates = {}
    snapshot.forEach(child => {
      if (!isRunning(child.val(), now)) {
        updates[child.key] = null
      }
    })
    const count = Object.keys(updates).length
    if (count > 0) {
      await limitsRef().update(updates)
    }
    return count
  }

  return { acquire, release, retryAfterMs, pruneExpired }
}

// Accepted submissions per login (uid) and hour
const submissionLimiter = createRateLimiter({
  path: '/pprRateLimits',
  windowMs: WINDOW_MS,
  maxPerWindow: MAX_PER_WINDOW,
  keyFor: escapedKey
})

// Accepted submissions without login per client (clientIp.js) and hour,
// and per mailbox (auth/signInEmail.js mailboxKey) and hour and day
const guestClientLimiter = createRateLimiter({
  path: '/pprGuestRateLimits/client',
  windowMs: WINDOW_MS,
  maxPerWindow: GUEST_MAX_PER_CLIENT,
  keyFor: hashedKey
})
const guestMailboxLimiter = createRateLimiter({
  path: '/pprGuestRateLimits/mailbox',
  windowMs: WINDOW_MS,
  maxPerWindow: GUEST_MAX_PER_MAILBOX,
  keyFor: hashedKey
})
const guestMailboxDayLimiter = createRateLimiter({
  path: '/pprGuestRateLimits/mailboxDay',
  windowMs: DAY_WINDOW_MS,
  maxPerWindow: GUEST_MAX_PER_MAILBOX_PER_DAY,
  keyFor: hashedKey
})

module.exports = {
  WINDOW_MS,
  DAY_WINDOW_MS,
  MAX_PER_WINDOW,
  GUEST_MAX_PER_CLIENT,
  GUEST_MAX_PER_MAILBOX,
  GUEST_MAX_PER_MAILBOX_PER_DAY,
  acquire: submissionLimiter.acquire,
  release: submissionLimiter.release,
  pruneExpired: submissionLimiter.pruneExpired,
  guestClientLimiter,
  guestMailboxLimiter,
  guestMailboxDayLimiter
}
