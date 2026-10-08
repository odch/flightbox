const { onValueWritten } = require('firebase-functions/v2/database')
const { defineString } = require('firebase-functions/params')
const { syncToCustoms, toArray } = require('./syncToCustoms')

const RTDB_INSTANCE = defineString('RTDB_INSTANCE')
const RTDB_REGION = defineString('RTDB_REGION', { default: 'europe-west1' })

const instanceOpt = `{{ params.${RTDB_INSTANCE.name} }}`
const regionOpt = `{{ params.${RTDB_REGION.name} }}`

// Holds the self-declarants: [{ email, registrations }] (the path keeps its
// original name from when it held plain e-mails).
const SELF_DECLARATION_EMAILS_PATH = '/settings/customsSelfDeclarationEmails'

// Same rule as in the frontend and the customs app: upper case, only letters
// and digits (so "hb-kla", "HB KLA" and "HBKLA" are equal), 1 to 10 characters.
const REGISTRATION_PATTERN = /^[A-Z0-9]{1,10}$/

function normalizeRegistrations(value) {
  const registrations = toArray(value)
    .filter(registration => typeof registration === 'string')
    .map(registration => registration.toUpperCase().replace(/[^A-Z0-9]/g, ''))
    .filter(registration => REGISTRATION_PATTERN.test(registration))
  return Array.from(new Set(registrations))
}

// The customs app validates each entry itself and reports the rejected ones,
// so only the shape is normalised here: one entry per e-mail (duplicates
// merged), with normalised, unique registrations. Entries of the first
// version (plain e-mail strings) are sent as persons without aircraft, whose
// declarations the customs app never forwards without review.
function buildBody(value) {
  const registrationsByEmail = new Map()

  for (const entry of toArray(value)) {
    let email
    let registrations
    if (typeof entry === 'string') {
      email = entry
      registrations = []
    } else if (entry && typeof entry === 'object' && typeof entry.email === 'string') {
      email = entry.email
      registrations = normalizeRegistrations(entry.registrations)
    } else {
      continue
    }

    email = email.trim().toLowerCase()
    if (email.length === 0) {
      continue
    }

    const existing = registrationsByEmail.get(email) || []
    registrationsByEmail.set(email, Array.from(new Set([...existing, ...registrations])))
  }

  return Array.from(registrationsByEmail, ([email, registrations]) => ({ email, registrations }))
}

// Every write pushes the full current list (an idempotent PUT), so a list
// that failed to sync is pushed again with the next change.
module.exports.updateCustomsSelfDeclarationEmailsOnUpdate = onValueWritten(
  { region: regionOpt, instance: instanceOpt, ref: SELF_DECLARATION_EMAILS_PATH },
  async () => {
    await syncToCustoms({
      sourcePath: SELF_DECLARATION_EMAILS_PATH,
      endpoint: '/api/self-declaration-emails',
      statusKey: 'selfDeclarationEmails',
      buildBody,
      label: 'self-declarants',
    })
  }
)

module.exports.buildBody = buildBody
