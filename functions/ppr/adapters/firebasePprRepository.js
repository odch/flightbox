'use strict'

const { getDatabase } = require('firebase-admin/database')

function pprRef() {
  return getDatabase().ref('/pprRequests')
}

async function save(pprRequest) {
  const ref = await pprRef().push(pprRequest)
  return { key: ref.key }
}

function toRequest(key, snapshot) {
  const value = snapshot.val()
  return value === null ? null : { key, ...value }
}

// Both run as transactions, so the check and the write can't be interleaved
// with a concurrent update or delete. The first call of the update function
// may get null before the server value is known: returning null then lets
// the server answer with the real value (and is a no-op if there is none).
async function updateIf(key, predicate, data) {
  let applied = false
  const { snapshot } = await pprRef().child(key).transaction(current => {
    applied = false
    if (current === null) return null
    if (!predicate({ key, ...current })) return undefined // abort
    applied = true
    return { ...current, ...data }
  })
  return { applied, request: toRequest(key, snapshot) }
}

async function removeIf(key, predicate) {
  let removed = null
  const { snapshot } = await pprRef().child(key).transaction(current => {
    removed = null
    if (current === null) return null
    if (!predicate({ key, ...current })) return undefined // abort
    removed = { key, ...current }
    return null
  })
  return removed
    ? { applied: true, request: removed }
    : { applied: false, request: toRequest(key, snapshot) }
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

function snapshotToArray(snapshot) {
  const results = []
  snapshot.forEach(child => {
    results.push({ key: child.key, ...child.val() })
  })
  return results
}

module.exports = {
  save,
  updateIf,
  removeIf,
  findAll,
  findByEmail
}
