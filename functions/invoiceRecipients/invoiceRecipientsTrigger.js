const { onValueWritten } = require('firebase-functions/v2/database')
const { logger } = require('firebase-functions/v2')
const { defineString } = require('firebase-functions/params')
const admin = require('firebase-admin')

const RTDB_INSTANCE = defineString('RTDB_INSTANCE')
const RTDB_REGION = defineString('RTDB_REGION', { default: 'europe-west1' })

const instanceOpt = `{{ params.${RTDB_INSTANCE.name} }}`
const regionOpt = `{{ params.${RTDB_REGION.name} }}`

module.exports.updateCustomsInvoiceRecipientsOnUpdate = onValueWritten(
  { region: regionOpt, instance: instanceOpt, ref: '/settings/invoiceRecipients' },
  async (event) => {
    const before = event.data.before.val()
    const after = event.data.after.val()

    if (JSON.stringify(before) === JSON.stringify(after)) {
      logger.info('No change detected.')
      return
    }

    const snapshot = await admin.database().ref('/settings/customsDeclarationApp').once('value')
    const customsSettings = snapshot.val()

    if (!customsSettings || !customsSettings.baseUrl) {
      logger.info('No customs declaration settings in /settings/customsDeclarationApp. Aborting...')
      return
    }

    const url = `${customsSettings.baseUrl}/api/invoice-recipients?ad=${customsSettings.aerodrome}`

    const body = (after || []).map(recipient => ({
      name: recipient.name,
      emails: recipient.emails || []
    }))

    const jsonBody = JSON.stringify(body)

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${customsSettings.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: jsonBody
    })

    if (response.ok) {
      logger.info('Successfully updated invoice recipients of the customs app')
    } else {
      logger.error('Failed to update the invoice recipients of the customs app', response)

      const body = await response.json()
      logger.error('Response body', body)
    }
  }
)
