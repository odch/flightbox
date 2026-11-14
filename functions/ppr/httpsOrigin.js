'use strict'

const { URL } = require('url')

// The app URL in functions/ppr-config.generated.js (the base of links in the
// PPR emails) must be an https origin: scheme, host and optional port only,
// without credentials, path, query or fragment (not even an empty '?' or
// '#'). Returns the normalised origin, e.g. 'https://lspl-test.web.app' for
// 'https://LSPL-test.web.app/', or null. The deploy checks the configured
// value with it (tasks/generatePprConfig.js), and the functions check it
// again before they build links (deployConfig.js).
function httpsOrigin(value) {
  if (typeof value !== 'string') {
    return null
  }
  let url
  try {
    url = new URL(value)
  } catch (e) {
    return null
  }
  return url.protocol === 'https:' && url.href === `${url.origin}/` ? url.origin : null
}

module.exports = { httpsOrigin }
