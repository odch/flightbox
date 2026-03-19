'use strict'

const admin = require('firebase-admin')
const nodemailer = require('nodemailer')

const REQUIRED_SMTP_SETTINGS = ['host', 'port', 'user', 'password', 'fromEmail', 'fromName']

const loadSmtpSettings = async () => {
  const snapshot = await admin.database().ref('/settings/emailSmtp').once('value')
  const settings = snapshot.val()

  if (!settings) {
    throw new Error('SMTP settings not found in database')
  }

  const missingSettings = REQUIRED_SMTP_SETTINGS.filter(setting => !settings[setting])
  if (missingSettings.length > 0) {
    throw new Error(`Missing SMTP settings: ${missingSettings.join(', ')}`)
  }

  return settings
}

const createTransporter = (settings) => {
  return nodemailer.createTransport({
    host: settings.host,
    port: parseInt(settings.port),
    secure: true,
    auth: {
      user: settings.user,
      pass: settings.password,
    },
  })
}

module.exports = { loadSmtpSettings, createTransporter }
