'use strict'

const admin = require('firebase-admin')

function pprRef() {
  return admin.database().ref('/pprRequests')
}

async function save(pprRequest) {
  const ref = await pprRef().push(pprRequest)
  return { key: ref.key }
}

async function updateStatus(key, statusData) {
  await pprRef().child(key).update(statusData)
}

async function findByKey(key) {
  const snapshot = await pprRef().child(key).once('value')
  if (!snapshot.exists()) return null
  return { key, ...snapshot.val() }
}

async function findAll() {
  const snapshot = await pprRef()
    .orderByChild('negativeTimestamp')
    .once('value')
  return snapshotToArray(snapshot)
}

async function findByEmail(email) {
  const snapshot = await pprRef()
    .orderByChild('createdBy')
    .equalTo(email)
    .once('value')
  return snapshotToArray(snapshot)
}

async function deleteByKey(key) {
  await pprRef().child(key).remove()
}

function snapshotToArray(snapshot) {
  const results = []
  snapshot.forEach(child => {
    results.push({ key: child.key, ...child.val() })
  })
  return results
}

module.exports = {
  save,
  updateStatus,
  findByKey,
  findAll,
  findByEmail,
  deleteByKey
}
