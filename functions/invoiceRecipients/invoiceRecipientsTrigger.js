const { onValueWritten } = require('firebase-functions/v2/database')
const { logger } = require('firebase-functions/v2')
const { defineString } = require('firebase-functions/params')
const { syncToCustoms, toArray } = require('../customs/syncToCustoms')

const RTDB_INSTANCE = defineString('RTDB_INSTANCE')
const RTDB_REGION = defineString('RTDB_REGION', { default: 'europe-west1' })

const instanceOpt = `{{ params.${RTDB_INSTANCE.name} }}`
const regionOpt = `{{ params.${RTDB_REGION.name} }}`

const INVOICE_RECIPIENTS_PATH = '/settings/invoiceRecipients'

function buildBody(value) {
  return toArray(value)
    .filter(recipient => recipient && typeof recipient === 'object')
    .map(recipient => ({
      name: recipient.name,
      emails: recipient.emails || []
    }))
}

module.exports.updateCustomsInvoiceRecipientsOnUpdate = onValueWritten(
  { region: regionOpt, instance: instanceOpt, ref: INVOICE_RECIPIENTS_PATH, retry: true },
  async (event) => {
    const before = event.data.before.val()
    const after = event.data.after.val()

    if (JSON.stringify(before) === JSON.stringify(after)) {
      logger.info('No change detected.')
      return
    }

    await syncToCustoms({
      sourcePath: INVOICE_RECIPIENTS_PATH,
      endpoint: '/api/invoice-recipients',
      statusKey: 'invoiceRecipients',
      buildBody,
      label: 'invoice recipients',
    })
  }
)

module.exports.buildBody = buildBody
