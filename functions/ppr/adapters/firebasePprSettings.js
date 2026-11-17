'use strict'

const { getDatabase } = require('firebase-admin/database')

function adminEmailRef() {
  return getDatabase().ref('/settings/ppr/adminEmail')
}

async function getAdminEmail() {
  const snapshot = await adminEmailRef().once('value')
  return snapshot.val() || null
}

function retentionDaysRef() {
  return getDatabase().ref('/settings/ppr/retentionDays')
}

// The stored value as it is (null if none); validated by the callers
async function getRetentionDays() {
  const snapshot = await retentionDaysRef().once('value')
  return snapshot.val()
}

// How new requests are answered: answer mode, information for pilots,
// closures and the requests an admin always answers, as stored (validated by
// the callers). One read for a submission.
async function getAnswerSettings() {
  const snapshot = await getDatabase().ref('/settings/ppr').once('value')
  const stored = snapshot.val() || {}
  return {
    answerMode: stored.answerMode === undefined ? null : stored.answerMode,
    pilotInfo: stored.pilotInfo === undefined ? null : stored.pilotInfo,
    closures: stored.closures === undefined ? null : stored.closures,
    manualAnswers: stored.manualAnswers === undefined ? null : stored.manualAnswers
  }
}

// How each setting is stored: empty values as nothing, which removes them
const STORED = {
  // null removes the address
  adminEmail: email => email || null,
  // null removes it, so the cleanup deletes nothing
  retentionDays: days => days || null,
  // 'manual' is the default, so it is stored as nothing
  answerMode: answerMode => answerMode === 'automatic' ? answerMode : null,
  pilotInfo: pilotInfo => pilotInfo || null,
  closures: closures => closures && closures.length > 0 ? closures : null,
  // { helicopters, mtowFrom }; nothing while both are off
  manualAnswers: manualAnswers => {
    const { helicopters, mtowFrom } = manualAnswers || {}
    return helicopters || mtowFrom ? { helicopters: helicopters === true, mtowFrom: mtowFrom || null } : null
  }
}

// The given settings (validated by the callers) in one write: a submission
// never reads some of them changed and others not, e.g. automatic answers
// without the aircraft an admin answers. Settings not given stay as they are.
async function saveSettings(values) {
  const update = {}
  Object.keys(STORED).forEach(name => {
    if (name in values) {
      update[name] = STORED[name](values[name])
    }
  })
  if (Object.keys(update).length > 0) {
    await getDatabase().ref('/settings/ppr').update(update)
  }
}

module.exports = {
  getAdminEmail,
  getRetentionDays,
  getAnswerSettings,
  saveSettings
}
