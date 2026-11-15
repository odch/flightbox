'use strict'

const { REQUEST_KEY_PATTERN } = require('../domain/pprRequest')
const { STATUS_TOKEN_PATTERN } = require('../domain/pprStatusLink')

// The links from the PPR emails into the app. They are a contract with the
// client: the app uses hash routing (src/history.ts), so change both sides
// together. Do not use `t` or `kt`, the parameters of the guest and kiosk
// tokens.

// REQUEST_KEY_PATTERN.test would turn undefined into 'undefined'
const isValidKey = key => typeof key === 'string' && REQUEST_KEY_PATTERN.test(key)

// Link from the aerodrome's email to a request in the app's admin area, where
// an admin approves or rejects it with their normal login. The link only
// opens the request: no action happens on GET (mail scanners open links),
// and it carries no token (a shared mailbox would hold a credential). The
// admin page opens the tab named in `tab` and the request whose key is in
// `request`.
function pprRequestAdminUrl(origin, key) {
  if (typeof origin !== 'string' || origin === '' || !isValidKey(key)) {
    return null
  }
  return `${origin}/#/admin?tab=ppr&request=${encodeURIComponent(key)}`
}

// Link from the pilot's emails to the status page of a request, which needs
// no login: the token proves that the link came from such an email. It is a
// path segment of the fragment, which browsers send neither to the server
// nor in the Referer; the page sends it to the functions in a request body.
function pprRequestStatusUrl(origin, key, token) {
  if (typeof origin !== 'string' || origin === '' || !isValidKey(key) ||
    typeof token !== 'string' || !STATUS_TOKEN_PATTERN.test(token)) {
    return null
  }
  return `${origin}/#/ppr/status/${encodeURIComponent(key)}/${encodeURIComponent(token)}`
}

module.exports = { pprRequestAdminUrl, pprRequestStatusUrl }
