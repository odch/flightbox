const functions = require('firebase-functions')
const admin = require('firebase-admin')
const express = require('express')
const cors = require('cors')({origin: true, credentials: true})
const fetchAerodromeStatus = require('./fetchAerodromeStatus')
const basicAuth = require('./basicAuth')
const syncUsers = require('./syncUsers')

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

api.post('(/api)?/users/import', basicAuth, async (req, res) => {
  try {
    const users = req.body.users
    if (!Array.isArray(users)) {
      return res.status(400).send('Invalid users format')
    }

    const db = admin.database()
    await syncUsers(db, users)

    res.status(200).send({ message: 'Users imported successfully' })
  } catch (e) {
    console.error('Failed to import users', e)
    res.status(500).send({ error: 'Failed to import users' })
  }
})

module.exports = functions.https.onRequest(api)
