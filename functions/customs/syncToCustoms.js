const { logger } = require('firebase-functions/v2')
const { getDatabase } = require('firebase-admin/database')

const CUSTOMS_SETTINGS_PATH = '/settings/customsDeclarationApp'
const SYNC_STATUS_PATH = '/settings/customsSyncStatus'

// RTDB returns an array as an object when its keys are sparse (e.g. after an
// entry was deleted in the console), so accept both.
function toArray(value) {
  if (Array.isArray(value)) {
    return value
  }
  if (value && typeof value === 'object') {
    return Object.values(value)
  }
  return []
}

async function readJson(response) {
  try {
    return await response.json()
  } catch (e) {
    // Not every response (e.g. a proxy error page) has a JSON body.
    return null
  }
}

// The status is informational (shown to admins), so failing to write it must
// neither mask the sync result nor trigger a retry on its own.
async function writeStatus(db, statusKey, status) {
  try {
    await db.ref(`${SYNC_STATUS_PATH}/${statusKey}`).set({
      ...status,
      timestamp: new Date().toISOString(),
    })
  } catch (e) {
    logger.error(`Failed to write the customs sync status for ${statusKey}`, e)
  }
}

/**
 * Pushes the current value of `sourcePath` to the customs declaration app
 * (PUT `${baseUrl}${endpoint}?ad=<aerodrome>`) and records the outcome in
 * /settings/customsSyncStatus/<statusKey>.
 *
 * The value is read anew rather than taken from the triggering event, so a
 * retried (possibly older) event never pushes stale data.
 *
 * Retries: a 2xx or 4xx response resolves (a 4xx would fail again on
 * retry). A 5xx response or a network error rejects, so that a trigger
 * deployed with `retry: true` is retried.
 *
 * @param {object} options
 * @param {string} options.sourcePath RTDB path whose value is pushed
 * @param {string} options.endpoint path on the customs app, e.g. '/api/invoice-recipients'
 * @param {string} options.statusKey key below /settings/customsSyncStatus
 * @param {(value: any) => any} options.buildBody maps the value to the request body
 * @param {string} options.label describes the data in log messages
 */
async function syncToCustoms({ sourcePath, endpoint, statusKey, buildBody, label }) {
  const db = getDatabase()

  const settingsSnapshot = await db.ref(CUSTOMS_SETTINGS_PATH).once('value')
  const customsSettings = settingsSnapshot.val()

  if (!customsSettings || !customsSettings.baseUrl) {
    logger.info(`No customs declaration settings in ${CUSTOMS_SETTINGS_PATH}. Aborting...`)
    return
  }

  const sourceSnapshot = await db.ref(sourcePath).once('value')
  const body = buildBody(sourceSnapshot.val())

  const url = `${customsSettings.baseUrl}${endpoint}?ad=${encodeURIComponent(customsSettings.aerodrome)}`

  let response
  try {
    response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${customsSettings.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })
  } catch (e) {
    logger.error(`Failed to reach the customs app to update the ${label}`, e)
    await writeStatus(db, statusKey, { status: 'error' })
    throw e
  }

  const responseBody = await readJson(response)

  if (response.ok) {
    const rejected = responseBody && Array.isArray(responseBody.rejected)
      ? responseBody.rejected.filter(entry => typeof entry === 'string')
      : []

    if (rejected.length > 0) {
      // only the count: the entries (personal e-mails) are shown to admins
      // in the sync status, but must not end up in the logs
      logger.warn(`The customs app rejected some of the ${label}`, { rejectedCount: rejected.length })
    }
    logger.info(`Successfully updated the ${label} of the customs app`)

    await writeStatus(db, statusKey, rejected.length > 0
      ? { status: 'ok', rejected }
      : { status: 'ok' })
    return
  }

  logger.error(`Failed to update the ${label} of the customs app`, {
    httpStatus: response.status,
    body: responseBody,
  })
  await writeStatus(db, statusKey, { status: 'error', httpStatus: response.status })

  if (response.status >= 500) {
    throw new Error(`The customs app responded with HTTP ${response.status}`)
  }
}

module.exports = {
  syncToCustoms,
  toArray,
}
