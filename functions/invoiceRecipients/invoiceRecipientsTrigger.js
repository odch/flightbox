const functions = require('firebase-functions')
const admin = require('firebase-admin')

const instance = functions.config().rtdb.instance

module.exports.updateCustomsInvoiceRecipientsOnUpdate =
  functions.database.instance(instance).ref('/settings/invoiceRecipients')
    .onWrite(async (change, context) => {
      const before = change.before.val()
      const after = change.after.val()

      if (JSON.stringify(before) === JSON.stringify(after)) {
        console.log('No change detected.')
        return
      }

      const snapshot = await admin.database().ref('/settings/customsDeclarationApp').once('value')
      const customsSettings = snapshot.val()

      if (!customsSettings || !customsSettings.baseUrl) {
        console.log('No customs declaration settings in /settings/customsDeclarationApp. Aborting...')
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
        console.log('Successfully updated invoice recipients of the customs app')
      } else {
        console.log('Failed to update the invoice recipients of the customs app', response)

        const body = await response.json()
        console.log('Response body', body)
      }
    })
