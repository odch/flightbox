'use strict'

const { runtimeProjectId } = require('../projectConfig')

// PPR is enabled per aerodrome with `ppr` in projects/<name>.json. The deploy
// workflows write { enabled, firebaseProjectId } to
// functions/ppr-config.generated.js, which is read at module load: during
// deploy source analysis (firebase-tools sets GCLOUD_PROJECT there) as well
// as at runtime. The flag only counts for the Firebase project it was written
// for, so a file left over from local work cannot enable PPR in another
// project. Without the file (unit tests) PPR stays disabled.
function isPprEnabled(loadFlag = () => require('../ppr-config.generated.js'), env = process.env) {
  let flag
  try {
    flag = loadFlag()
  } catch (e) {
    if (e.code !== 'MODULE_NOT_FOUND') throw e
    return false
  }
  return !!flag &&
    flag.enabled === true &&
    !!flag.firebaseProjectId &&
    flag.firebaseProjectId === runtimeProjectId(env)
}

module.exports = { isPprEnabled }
