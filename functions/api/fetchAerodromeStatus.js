'use strict';

const fetchAerodromeStatus = async firebase => {
  const snapshot = await firebase.ref('/status')
    .orderByChild('timestamp')
    .limitToLast(1)
    .once('value')
  const map = snapshot.val()
  const arr = map ? Object.values(map) : []

  if (arr.length > 0) {
    const status = arr[0]
    return {
      status: status.status,
      last_update_date: new Date(status.timestamp).toISOString(),
      last_update_by: status.by,
      message: status.details
    }
  }

  return {}
}

module.exports = fetchAerodromeStatus
