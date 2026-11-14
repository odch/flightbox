'use strict'

const { runtimeProjectId } = require('../projectConfig')
const { sanitizeThemeColor } = require('../email/themeColor')

const loadGeneratedConfig = () => require('../ppr-config.generated.js')

// The deploy workflows write functions/ppr-config.generated.js with
// tasks/generatePprConfig.js: { enabled, firebaseProjectId } plus the
// aerodromeName, themeColor and appUrl the project sets. It is read at module
// load (enabled.js: during deploy source analysis, where firebase-tools sets
// GCLOUD_PROJECT, and at runtime) and for each PPR email. It only counts for
// the Firebase project it was written for, so a file left over from local
// work cannot enable PPR or change the emails in another project. Without
// the file (unit tests) there is no config: null, as for another project.
// Other errors (e.g. a broken file) are thrown.
function loadPprConfig(loadConfig = loadGeneratedConfig, env = process.env) {
  let config
  try {
    config = loadConfig()
  } catch (e) {
    if (e.code !== 'MODULE_NOT_FOUND') throw e
    return null
  }
  const isForThisProject = !!config &&
    typeof config === 'object' &&
    !!config.firebaseProjectId &&
    config.firebaseProjectId === runtimeProjectId(env)
  return isForThisProject ? config : null
}

// The header of the PPR emails, like the sign-in email's: the aerodrome's
// name ('' when not known) and theme colour (a safe default when not known
// or invalid).
function pprBranding(loadConfig, env) {
  const config = loadPprConfig(loadConfig, env)
  const name = config && typeof config.aerodromeName === 'string' ? config.aerodromeName.trim() : ''
  return {
    aerodromeName: name,
    themeColor: sanitizeThemeColor(config ? config.themeColor : undefined)
  }
}

module.exports = {
  loadPprConfig,
  pprBranding
}
