const admin = require('firebase-admin')
const moment = require('moment')

const loadByImmatriculation = async (path, immatriculation) => {
  const ref = admin.database().ref(path)
    .orderByChild('immatriculation')
    .equalTo(immatriculation);
  const snapshot = await ref.once('value')
  return {
    snapshot,
    ref
  }
}

const addWithType = (movements, type) => movementSnapshot => {
  const data = movementSnapshot.val()
  data.key = movementSnapshot.ref.key
  data.type = type
  movements.push(data)
}

const compareDescending = (a, b) => {
  const momentA = moment(a.dateTime)
  const momentB = moment(b.dateTime)

  if (momentA.isBefore(momentB)) {
    return 1
  }
  if (momentA.isAfter(momentB)) {
    return -1
  }

  return 0
}

const loadAircraftMovements = async immatriculation => {
  const loadedMovements = await Promise.all([
    loadByImmatriculation('/departures', immatriculation),
    loadByImmatriculation('/arrivals', immatriculation)
  ])

  const departures = loadedMovements[0]
  const arrivals = loadedMovements[1]

  const aircraftMovements = []

  departures.snapshot.forEach(addWithType(aircraftMovements, 'departure'))
  arrivals.snapshot.forEach(addWithType(aircraftMovements, 'arrival'))

  aircraftMovements.sort(compareDescending)

  return aircraftMovements
}

const isCircuit = movement => {
  const route = movement.departureRoute || movement.arrivalRoute
  return route === 'circuits'
}

const hasValidRoute = (movement, expectCircuits) => {
  const route = movement.departureRoute || movement.arrivalRoute
  return expectCircuits && route === 'circuits' || !expectCircuits && route !== 'circuits'
}

const ifType = (movement, expectedType, expectCircuits) => {
  if (movement && movement.type === expectedType && hasValidRoute(movement, expectCircuits)) {
    return movement
  }
  return null
}

/**
 * return null if wrong
 */
const getAssociatedMovement = (movement, isHomeBase, aircraftMovements) => {
  const expectCircuit = isCircuit(movement)

  const relevantMovements = aircraftMovements.filter(m => expectCircuit === isCircuit(m))

  const index = relevantMovements.findIndex(m => m.key === movement.key)

  const preceding = relevantMovements[index + 1]
  const subsequent = relevantMovements[index - 1]

  if (expectCircuit) {
    if (movement.type === 'departure') {
      return ifType(subsequent, 'arrival', expectCircuit)
    } else if (movement.type === 'arrival') {
      return ifType(preceding, 'departure', expectCircuit)
    }
  } else {
    if (movement.type === 'departure') {
      if (isHomeBase) {
        return ifType(subsequent, 'arrival', expectCircuit)
      } else {
        return ifType(preceding, 'arrival', expectCircuit)
      }
    } else if (movement.type === 'arrival') {
      if (isHomeBase) {
        return ifType(preceding, 'departure', expectCircuit)
      } else {
        return ifType(subsequent, 'departure', expectCircuit)
      }
    }
  }

  throw new Error('Code should not be reached')
}

const path = (movementType) => '/movementAssociations' + (movementType === 'departure' ? '/departures' : '/arrivals')

const setAssociatedMovement = async (movementKey, movementType, associatedMovement) => {
  const newData = associatedMovement ? {
    key: associatedMovement.key,
    type: associatedMovement.type
  } : {
    type: 'none'
  }

  const basePath = path(movementType)

  await admin.database().ref(basePath).child(movementKey).update(newData)
}

const isHomeBase = async immatriculation => {
  const clubAircrafts = await admin.database().ref('/settings/aircrafts/club').once('value')
  if (clubAircrafts.hasChild(immatriculation)) {
    return true
  }

  const homeBaseAircrafts = await admin.database().ref('/settings/aircrafts/homeBase').once('value')
  if (homeBaseAircrafts.hasChild(immatriculation)) {
    return true
  }

  return false
}

module.exports.compareDescending = compareDescending
module.exports.addWithType = addWithType
module.exports.path = path
module.exports.loadAircraftMovements = loadAircraftMovements
module.exports.getAssociatedMovement = getAssociatedMovement
module.exports.setAssociatedMovement = setAssociatedMovement
module.exports.isHomeBase = isHomeBase
