const { onValueWritten } = require('firebase-functions/v2/database')
const { logger } = require('firebase-functions/v2')
const { defineString } = require('firebase-functions/params')
const admin = require('firebase-admin')

const RTDB_INSTANCE = defineString('RTDB_INSTANCE')
const RTDB_REGION = defineString('RTDB_REGION', { default: 'europe-west1' })

const instanceOpt = `{{ params.${RTDB_INSTANCE.name} }}`
const regionOpt = `{{ params.${RTDB_REGION.name} }}`

function buildBody(snapshot) {
  const homeBase = (snapshot && snapshot.homeBase) || {}
  const club = (snapshot && snapshot.club) || {}
  const registrations = Array.from(new Set([...Object.keys(homeBase), ...Object.keys(club)]))
  return registrations.map(registration => ({ registration }))
}

module.exports.updateCustomsHomebasedAircraftOnUpdate = onValueWritten(
  { region: regionOpt, instance: instanceOpt, ref: '/settings/aircrafts' },
  async (event) => {
    const beforeBody = buildBody(event.data.before.val())
    const afterBody = buildBody(event.data.after.val())
    const jsonBody = JSON.stringify(afterBody)

    if (JSON.stringify(beforeBody) === jsonBody) {
      logger.info('No change detected.')
      return
    }

    const snapshot = await admin.database().ref('/settings/customsDeclarationApp').once('value')
    const customsSettings = snapshot.val()

    if (!customsSettings || !customsSettings.baseUrl) {
      logger.info('No customs declaration settings in /settings/customsDeclarationApp. Aborting...')
      return
    }

    const url = `${customsSettings.baseUrl}/api/homebased-aircraft?ad=${customsSettings.aerodrome}`

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${customsSettings.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: jsonBody
    })

    if (response.ok) {
      logger.info('Successfully updated homebased aircraft of the customs app')
    } else {
      logger.error('Failed to update the homebased aircraft of the customs app', response)

      const responseBody = await response.text().catch(() => '')
      logger.error('Response body', responseBody)
    }
  }
)
