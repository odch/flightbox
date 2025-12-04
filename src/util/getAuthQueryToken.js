const PATTERN = /\b[0-9a-f]{8}\b-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-\b[0-9a-f]{12}\b/

const getAuthQueryToken = (location, queryParamName = 't', stateParamName = 'queryToken') => {
  if (location.state && location.state[stateParamName]) {
    return location.state[stateParamName]
  }

  const query = new URLSearchParams(location.search)
  const queryToken = query.get(queryParamName)

  if (PATTERN.test(queryToken)) {
    return queryToken
  }

  return null
}

export const getKioskAuthQueryToken = location => getAuthQueryToken(location, 'kt', 'kioskQueryToken')

export const getGuestOnly = location => {
  if (location.state && location.state.guestOnly) {
    return location.state.guestOnly
  }

  const query = new URLSearchParams(location.search)
  const guestOnly = query.get('guestOnly')

  return guestOnly === 'true'
}

export default getAuthQueryToken
