const functions = require('firebase-functions/v1')
const admin = require('firebase-admin')

const { rtdb = {} } = functions.config() || {}
const instance = rtdb.instance || process.env.RTDB_INSTANCE

function buildBody(snapshot) {
  const homeBase = (snapshot && snapshot.homeBase) || {}
  const club = (snapshot && snapshot.club) || {}
  const registrations = Array.from(new Set([...Object.keys(homeBase), ...Object.keys(club)]))
  return registrations.map(registration => ({ registration }))
}

module.exports.updateCustomsHomebasedAircraftOnUpdate =
  functions.region('europe-west1').database.instance(instance).ref('/settings/aircrafts')
    .onWrite(async (change, context) => {
      const beforeBody = buildBody(change.before.val())
      const afterBody = buildBody(change.after.val())
      const jsonBody = JSON.stringify(afterBody)

      if (JSON.stringify(beforeBody) === jsonBody) {
        console.log('No change detected.')
        return
      }

      const snapshot = await admin.database().ref('/settings/customsDeclarationApp').once('value')
      const customsSettings = snapshot.val()

      if (!customsSettings || !customsSettings.baseUrl) {
        console.log('No customs declaration settings in /settings/customsDeclarationApp. Aborting...')
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
        console.log('Successfully updated homebased aircraft of the customs app')
      } else {
        console.log('Failed to update the homebased aircraft of the customs app', response)

        const responseBody = await response.text().catch(() => '')
        console.log('Response body', responseBody)
      }
    })
