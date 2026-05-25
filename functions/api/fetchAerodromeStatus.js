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
    const user = {}
    if (status.uid) user.uid = status.uid
    if (status.firstname) user.firstname = status.firstname
    if (status.lastname) user.lastname = status.lastname
    if (status.email) user.email = status.email

    const response = {
      status: status.status,
      last_update_date: new Date(status.timestamp).toISOString(),
      last_update_by: status.by,
      message: status.details
    }
    if (Object.keys(user).length > 0) {
      response.last_update_user = user
    }
    return response
  }

  return {}
}

module.exports = fetchAerodromeStatus
