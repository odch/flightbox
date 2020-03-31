'use strict';

const fetchAerodromeStatus = async firebase => {
  const snapshot = await firebase.ref('/status')
    .orderByChild('timestamp')
    .limitToLast(1)
    .once('value')
  const map = snapshot.val()
  const arr = map ? Object.values(map) : []
  return arr.length > 0 ? arr[0] : {}
}

module.exports = fetchAerodromeStatus
