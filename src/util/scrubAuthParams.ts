// Access tokens (per-user `t`, kiosk `kt`) and the `guestOnly` flag arrive in
// the URL. Once they have been exchanged for a Firebase session they serve no
// further purpose, and leaving them in the address bar exposes the shared
// secret through history entries, bookmarks, and screen shares. This strips
// them from both the real query string and the HashRouter fragment.
const AUTH_PARAMS = ['t', 'kt', 'guestOnly']

/**
 * Pure helper: return `href` with the auth params removed from both the query
 * string and the hash-embedded query, preserving everything else (including the
 * HashRouter path).
 */
export const stripAuthParams = (href: string): string => {
  const url = new URL(href)

  AUTH_PARAMS.forEach(param => url.searchParams.delete(param))

  const hash = url.hash
  const queryIndex = hash.indexOf('?')
  if (queryIndex >= 0) {
    const path = hash.slice(0, queryIndex)
    const params = new URLSearchParams(hash.slice(queryIndex + 1))
    AUTH_PARAMS.forEach(param => params.delete(param))
    const rest = params.toString()
    url.hash = rest ? `${path}?${rest}` : path
  }

  return url.toString()
}

/**
 * Remove the auth params from the current URL via `history.replaceState`, so no
 * new history entry is created and the back button is unaffected.
 */
export const scrubAuthParamsFromUrl = (win: Window = window): void => {
  const next = stripAuthParams(win.location.href)
  if (next !== win.location.href) {
    win.history.replaceState(win.history.state, '', next)
  }
}

export default scrubAuthParamsFromUrl
