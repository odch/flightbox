const { onRequest } = require('firebase-functions/v2/https')
const { getDatabase } = require('firebase-admin/database')
const express = require('express')
const cors = require('cors')({origin: true, credentials: true})
const fetchAerodromeStatus = require('./fetchAerodromeStatus')
const fetchUserInvoiceRecipients = require('./fetchUserInvoiceRecipients')
const {fetchInvoices, fetchCheckouts, postPrepopulatedForm, isCustomsDeclarationAppAvailable} = require('./customs/fetchFromCustoms')
const {buildCustomsPayload} = require('./customs/buildCustomsPayload')
const {fbAuth, fbAdminAuth, fbAuthExcludingShared} = require('./fbAuth')
const {loadProjectConfig} = require('../projectConfig')
const {SCOPES, availableScopes} = require('../apiKeys/scopes')

const api = express()

api.use(cors)

// Public. /v1 is the documented path; the unversioned one stays for
// existing callers.
const AERODROME_STATUS_PATHS = ['/v1/aerodrome/status', '/api/v1/aerodrome/status', '/aerodrome/status', '/api/aerodrome/status']

api.get(AERODROME_STATUS_PATHS, async (req, res) => {
  const status = await fetchAerodromeStatus(getDatabase())

  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')

  res.setHeader('Content-Type', 'application/json')

  res.send(status)
})

api.get(['/customs/invoices', '/api/customs/invoices'], fbAdminAuth, async (req, res) => {
  try {
    const db = getDatabase()
    const {year, month} = req.query
    const invoices = await fetchInvoices(db, year, month)
    res.status(200).send(invoices)
  } catch (e) {
    console.error('Failed to fetch invoices from customs', e)
    res.status(500).send({ error: 'Failed to fetch invoices from customs' })
  }
})

api.get(['/customs/checkouts', '/api/customs/checkouts'], fbAdminAuth, async (req, res) => {
  try {
    const db = getDatabase()
    const {year, month} = req.query
    const invoices = await fetchCheckouts(db, year, month)
    res.status(200).send(invoices)
  } catch (e) {
    console.error('Failed to fetch checkouts from customs', e)
    res.status(500).send({ error: 'Failed to fetch checkouts from customs' })
  }
})

api.post(['/customs/prepopulated-forms', '/api/customs/prepopulated-forms'], fbAuthExcludingShared, async (req, res) => {
  try {
    const { movementType, movementKey } = req.body || {}

    // The only accepted input is a reference to an existing movement. The
    // outbound payload is built server-side from stored data (see
    // buildCustomsPayload), so the caller cannot inject arbitrary content into
    // the trusted customs integration.
    if ((movementType !== 'departure' && movementType !== 'arrival') || typeof movementKey !== 'string' || !movementKey) {
      return res.status(400).send({ error: 'movementType (departure|arrival) and movementKey are required' })
    }

    const db = getDatabase()

    const payload = await buildCustomsPayload(db, movementType, movementKey)
    if (!payload) {
      return res.status(404).send({ error: 'Movement not found' })
    }

    console.info(`Customs prepopulated form requested by ${req.fbUserId} for ${movementType}/${movementKey}`)

    const result = await postPrepopulatedForm(db, payload)
    if (!result) {
      return res.status(503).send({ error: 'Customs declaration app not configured' })
    }

    res.status(200).send(result)
  } catch (e) {
    console.error('Failed to post prepopulated form to customs', e)
    res.status(500).send({ error: 'Failed to post prepopulated form to customs' })
  }
})

api.get(['/customs/availability', '/api/customs/availability'], fbAuth, async (req, res) => {
  try {
    const db = getDatabase()
    const isAvailable = await isCustomsDeclarationAppAvailable(db)
    res.status(200).send({ available: isAvailable })
  } catch (e) {
    console.error('Failed to check customs availability', e)
    res.status(500).send({ error: 'Failed to check customs availability' })
  }
})

api.get(['/users/me/invoice-recipients', '/api/users/me/invoice-recipients'], fbAuth, async (req, res) => {
  try {
    const db = getDatabase()
    const invoiceRecipients = await fetchUserInvoiceRecipients(db, req.fbUserEmail)
    res.status(200).send(invoiceRecipients)
  } catch (e) {
    console.error('Failed to get user invoice recipients', e)
    res.status(500).send({ error: 'Failed to get user invoice recipients' })
  }
})

// API features are enabled per tenant (e.g. reportApiEnabled in
// projects/<name>.json, see functions/projectConfig.js). External programs
// call them with API keys that admins manage; admins can call them too.
const projectConfig = loadProjectConfig()
const apiKeyScopes = availableScopes(projectConfig)
if (apiKeyScopes.length > 0) {
  require('./apiKeys').registerApiKeyRoutes(api, {availableScopes: apiKeyScopes, auth: fbAdminAuth})
}
if (projectConfig.reportApiEnabled === true) {
  const {apiKeyOrAdminAuth} = require('./apiKeyAuth')
  require('./reports').registerReportRoutes(api, projectConfig, apiKeyOrAdminAuth(SCOPES.REPORTS_AIRSTAT))
}

module.exports = onRequest({ region: 'europe-west1' }, api)
