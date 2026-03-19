'use strict'

const { getDatabase } = require('firebase-admin/database')

const WINDOW_MS = 60 * 60 * 1000 // 1 hour
const MAX_PER_WINDOW = 10

// Accepted PPR submissions per user and hour, counted in the database so the
// limit holds across function instances, cold starts and deploys (an
// in-memory counter would be per instance). Like /signInRateLimits.
function limitsRef() {
  return getDatabase().ref('/pprRateLimits')
}

// uids from Firebase Auth are safe keys; escape anything RTDB keys can't hold
function keyFor(uid) {
  return encodeURIComponent(uid).replace(/\./g, '%2E')
}

// Reserves a submission slot atomically; false when the limit is reached.
async function acquire(uid, now = Date.now()) {
  const { committed } = await limitsRef().child(keyFor(uid)).transaction(current => {
    if (current && now - current.windowStart < WINDOW_MS) {
      if (current.count >= MAX_PER_WINDOW) {
        return undefined // abort: limit reached
      }
      return { windowStart: current.windowStart, count: current.count + 1 }
    }
    return { windowStart: now, count: 1 }
  })
  return committed
}

// Gives a reserved slot back, for submissions that were rejected
async function release(uid) {
  await limitsRef().child(keyFor(uid)).transaction(current => {
    if (!current || !(current.count > 0)) {
      return current
    }
    return { windowStart: current.windowStart, count: current.count - 1 }
  })
}

// Deletes entries whose window has passed (run by the daily cleanup)
async function pruneExpired(now = Date.now()) {
  const snapshot = await limitsRef().once('value')
  const updates = {}
  snapshot.forEach(child => {
    const entry = child.val()
    if (!entry || !(now - entry.windowStart < WINDOW_MS)) {
      updates[child.key] = null
    }
  })
  const count = Object.keys(updates).length
  if (count > 0) {
    await limitsRef().update(updates)
  }
  return count
}

module.exports = {
  WINDOW_MS,
  MAX_PER_WINDOW,
  acquire,
  release,
  pruneExpired
}
