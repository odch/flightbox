'use strict'

const { REQUEST_KEY_PATTERN } = require('../domain/pprRequest')

// Link from the aerodrome's email to a request in the app's admin area, where
// an admin approves or rejects it with their normal login. The link only
// opens the request: no action happens on GET (mail scanners open links),
// and it carries no token (a shared mailbox would hold a credential).
//
// This is a contract with the client: the app uses hash routing
// (src/history.ts), and its admin page opens the tab named in `tab` and the
// request whose key is in `request`. Change both sides together, and do not
// use `t`, the parameter of the guest token.
function pprRequestAdminUrl(origin, key) {
  if (typeof origin !== 'string' || origin === '') {
    return null
  }
  // REQUEST_KEY_PATTERN.test would turn undefined into 'undefined'
  if (typeof key !== 'string' || !REQUEST_KEY_PATTERN.test(key)) {
    return null
  }
  return `${origin}/#/admin?tab=ppr&request=${encodeURIComponent(key)}`
}

module.exports = { pprRequestAdminUrl }
