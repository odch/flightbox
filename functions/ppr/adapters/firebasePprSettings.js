'use strict'

const { getDatabase } = require('firebase-admin/database')

function adminEmailRef() {
  return getDatabase().ref('/settings/ppr/adminEmail')
}

async function getAdminEmail() {
  const snapshot = await adminEmailRef().once('value')
  return snapshot.val() || null
}

// null removes the address
async function setAdminEmail(email) {
  await adminEmailRef().set(email || null)
}

function retentionDaysRef() {
  return getDatabase().ref('/settings/ppr/retentionDays')
}

// The stored value as it is (null if none); validated by the callers
async function getRetentionDays() {
  const snapshot = await retentionDaysRef().once('value')
  return snapshot.val()
}

// null removes it, so the default applies
async function setRetentionDays(days) {
  await retentionDaysRef().set(days || null)
}

module.exports = {
  getAdminEmail,
  setAdminEmail,
  getRetentionDays,
  setRetentionDays
}
