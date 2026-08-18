const PATTERN = /\b[0-9a-f]{8}\b-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-\b[0-9a-f]{12}\b/

interface AuthLocation {
  state?: Record<string, any> | null
  search: string
  // With the HashRouter the login/kiosk params live in the URL fragment
  // (e.g. `#/?kt=...`), which — unlike the query string — is never sent to the
  // server or leaked via the Referer header. `hash` is optional so plain
  // `window.location` and react-router locations are both accepted.
  hash?: string
}

// Extract the query part embedded in a HashRouter fragment: everything after
// the first `?` in the hash (`#/path?a=b` -> `a=b`).
const hashQuery = (hash?: string): string => {
  if (!hash) {
    return ''
  }
  const index = hash.indexOf('?')
  return index >= 0 ? hash.slice(index + 1) : ''
}

// Read a parameter from the real query string first, then fall back to the
// hash-embedded query. This keeps already-distributed `?param=` links working
// while allowing new links to carry the value in the fragment instead.
const readParam = (location: AuthLocation, paramName: string): string | null => {
  const fromSearch = new URLSearchParams(location.search).get(paramName)
  if (fromSearch !== null) {
    return fromSearch
  }
  return new URLSearchParams(hashQuery(location.hash)).get(paramName)
}

const getAuthQueryToken = (
  location: AuthLocation,
  queryParamName = 't',
  stateParamName = 'queryToken'
): string | null => {
  if (location.state && location.state[stateParamName]) {
    return location.state[stateParamName]
  }

  const queryToken = readParam(location, queryParamName)

  if (queryToken && PATTERN.test(queryToken)) {
    return queryToken
  }

  return null
}

export const getKioskAuthQueryToken = (
  location: AuthLocation
): string | null => getAuthQueryToken(location, 'kt', 'kioskQueryToken')

export const getGuestOnly = (
  location: AuthLocation
): boolean => {
  if (location.state && location.state.guestOnly) {
    return location.state.guestOnly
  }

  return readParam(location, 'guestOnly') === 'true'
}

export default getAuthQueryToken
