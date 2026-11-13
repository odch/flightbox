'use strict'

const { onSchedule } = require('firebase-functions/v2/scheduler')
const { getDatabase } = require('firebase-admin/database')
const { zurichDate, addDays } = require('./domain/pprRequest')
const rateLimiter = require('./adapters/firebaseRateLimiter')
const settings = require('./adapters/firebasePprSettings')
const { isValidRetentionDays } = require('./domain/pprSettings')

const SCHEDULE = '0 2 * * *' // Daily at 2 AM
const TIMEZONE = 'Europe/Zurich'

// Admins set it in the privacy tab. Without a value nothing is deleted, as
// for movements and messages; an invalid stored value (e.g. one set in the
// console) is ignored the same way instead of deleting everything.
async function getRetentionDays() {
  const stored = await settings.getRetentionDays()
  if (stored === null || stored === undefined) {
    return null
  }
  if (!isValidRetentionDays(stored)) {
    console.warn(`Ignoring invalid /settings/ppr/retentionDays (${JSON.stringify(stored)})`)
    return null
  }
  return stored
}

// The aerodrome's (Zurich) date `retentionDays` days ago, as 'YYYY-MM-DD'
function getCutoffDate(retentionDays, now = Date.now()) {
  return addDays(zurichDate(now), -retentionDays)
}

async function cleanupExpiredPprRequests() {
  const retentionDays = await getRetentionDays()
  if (retentionDays === null) {
    console.log('No PPR retention configured, skipping')
    return 0
  }
  const cutoffDate = getCutoffDate(retentionDays)

  const snapshot = await getDatabase().ref('/pprRequests').once('value')
  if (!snapshot.exists()) return 0

  const updates = {}
  let count = 0

  snapshot.forEach(child => {
    const request = child.val()
    if (request.plannedDate && request.plannedDate < cutoffDate) {
      updates[child.key] = null
      count++
    }
  })

  if (count > 0) {
    await getDatabase().ref('/pprRequests').update(updates)
  }

  return count
}

exports.scheduledPprCleanup = onSchedule(
  {
    region: 'europe-west1',
    schedule: SCHEDULE,
    timeZone: TIMEZONE,
  },
  async () => {
    const count = await cleanupExpiredPprRequests()
    if (count > 0) {
      console.log(`Cleaned up ${count} expired PPR requests`)
    }
    await rateLimiter.pruneExpired()
  }
)

exports.cleanupExpiredPprRequests = cleanupExpiredPprRequests
exports.getCutoffDate = getCutoffDate
