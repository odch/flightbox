const functions = require('firebase-functions')
const admin = require('firebase-admin')
const express = require('express')
const cors = require('cors')({origin: true, credentials: true})
const fetchAerodromeStatus = require('./fetchAerodromeStatus')

const api = express()

api.use(cors)

api.get('(/api)?/aerodrome/status', async (req, res) => {
  const status = await fetchAerodromeStatus(admin.database())

  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')

  res.setHeader('Content-Type', 'application/json')

  res.send(status)
})

module.exports = functions.https.onRequest(api)
