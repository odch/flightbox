'use strict'

const functions = require('firebase-functions')
const admin = require('firebase-admin')

const SCHEDULE = '0 2 * * *' // Daily at 2 AM
const TIMEZONE = 'Europe/Zurich'
const DEFAULT_RETENTION_DAYS = 30

async function getRetentionDays() {
  const snapshot = await admin.database().ref('/settings/ppr/retentionDays').once('value')
  const value = snapshot.val()
  return typeof value === 'number' && value > 0 ? value : DEFAULT_RETENTION_DAYS
}

function getCutoffDate(retentionDays) {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - retentionDays)
  const year = cutoff.getFullYear()
  const month = String(cutoff.getMonth() + 1).padStart(2, '0')
  const day = String(cutoff.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

async function cleanupExpiredPprRequests() {
  const retentionDays = await getRetentionDays()
  const cutoffDate = getCutoffDate(retentionDays)

  const snapshot = await admin.database().ref('/pprRequests').once('value')
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
    await admin.database().ref('/pprRequests').update(updates)
  }

  return count
}

exports.scheduledPprCleanup = functions.region('europe-west1').pubsub
  .schedule(SCHEDULE)
  .timeZone(TIMEZONE)
  .onRun(async () => {
    const count = await cleanupExpiredPprRequests()
    if (count > 0) {
      console.log(`Cleaned up ${count} expired PPR requests`)
    }
  })

exports.cleanupExpiredPprRequests = cleanupExpiredPprRequests
exports.getCutoffDate = getCutoffDate
