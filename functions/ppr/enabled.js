'use strict'

const { loadPprConfig } = require('./deployConfig')

// PPR is enabled per aerodrome with `ppr` in projects/<name>.json. The deploy
// workflows write it to functions/ppr-config.generated.js, which is read at
// module load: during deploy source analysis (firebase-tools sets
// GCLOUD_PROJECT there) as well as at runtime. The flag only counts for the
// Firebase project it was written for, so a file left over from local work
// cannot enable PPR in another project. Without the file (unit tests) PPR
// stays disabled. See deployConfig.js.
function isPprEnabled(loadFlag, env) {
  const config = loadPprConfig(loadFlag, env)
  return !!config && config.enabled === true
}

// Requests without login are allowed with `pprGuestRequests` (only where
// `ppr` is on), written to the same file as `guestRequests`. A file written
// before the flag existed has none: off.
function isPprGuestRequestsEnabled(loadFlag, env) {
  const config = loadPprConfig(loadFlag, env)
  return !!config && config.enabled === true && config.guestRequests === true
}

module.exports = { isPprEnabled, isPprGuestRequestsEnabled }
