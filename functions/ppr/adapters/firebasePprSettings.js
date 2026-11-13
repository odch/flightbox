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

// null removes it, so the cleanup deletes nothing
async function setRetentionDays(days) {
  await retentionDaysRef().set(days || null)
}

// How new requests are answered: answer mode, information for pilots and
// closures, as stored (validated by the callers). One read for a submission.
async function getAnswerSettings() {
  const snapshot = await getDatabase().ref('/settings/ppr').once('value')
  const stored = snapshot.val() || {}
  return {
    answerMode: stored.answerMode === undefined ? null : stored.answerMode,
    pilotInfo: stored.pilotInfo === undefined ? null : stored.pilotInfo,
    closures: stored.closures === undefined ? null : stored.closures
  }
}

// 'manual' is the default, so it is stored as nothing
async function setAnswerMode(answerMode) {
  await getDatabase().ref('/settings/ppr/answerMode').set(answerMode === 'automatic' ? answerMode : null)
}

// null removes the text
async function setPilotInfo(pilotInfo) {
  await getDatabase().ref('/settings/ppr/pilotInfo').set(pilotInfo || null)
}

// An empty list removes the closures
async function setClosures(closures) {
  await getDatabase().ref('/settings/ppr/closures').set(closures && closures.length > 0 ? closures : null)
}

module.exports = {
  getAdminEmail,
  setAdminEmail,
  getRetentionDays,
  setRetentionDays,
  getAnswerSettings,
  setAnswerMode,
  setPilotInfo,
  setClosures
}
