'use strict'

const { getDatabase } = require('firebase-admin/database')
const fetchAerodromeStatus = require('../../api/fetchAerodromeStatus')

// The status admins set in the "Flugplatz-Status" tab (open, restricted or
// closed, with details), as { status, details }; null if none was ever set
async function getCurrent() {
  const current = await fetchAerodromeStatus(getDatabase())
  if (!current || !current.status) {
    return null
  }
  return { status: current.status, details: current.message || null }
}

module.exports = { getCurrent }
