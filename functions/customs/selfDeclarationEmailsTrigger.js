const { onValueWritten } = require('firebase-functions/v2/database')
const { defineString } = require('firebase-functions/params')
const { syncToCustoms, toArray } = require('./syncToCustoms')

const RTDB_INSTANCE = defineString('RTDB_INSTANCE')
const RTDB_REGION = defineString('RTDB_REGION', { default: 'europe-west1' })

const instanceOpt = `{{ params.${RTDB_INSTANCE.name} }}`
const regionOpt = `{{ params.${RTDB_REGION.name} }}`

const SELF_DECLARATION_EMAILS_PATH = '/settings/customsSelfDeclarationEmails'

// The customs app validates each entry itself and reports the rejected ones,
// so only the shape is normalised here.
function buildBody(value) {
  const emails = toArray(value)
    .filter(email => typeof email === 'string')
    .map(email => email.trim().toLowerCase())
    .filter(email => email.length > 0)
  return Array.from(new Set(emails))
}

// Every write pushes the full current list (an idempotent PUT), so a list
// that failed to sync is pushed again with the next change.
module.exports.updateCustomsSelfDeclarationEmailsOnUpdate = onValueWritten(
  { region: regionOpt, instance: instanceOpt, ref: SELF_DECLARATION_EMAILS_PATH, retry: true },
  async () => {
    await syncToCustoms({
      sourcePath: SELF_DECLARATION_EMAILS_PATH,
      endpoint: '/api/self-declaration-emails',
      statusKey: 'selfDeclarationEmails',
      buildBody,
      label: 'self-declaration e-mails',
    })
  }
)

module.exports.buildBody = buildBody
