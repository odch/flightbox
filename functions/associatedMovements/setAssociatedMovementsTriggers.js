const functions = require('firebase-functions')
const admin = require('firebase-admin')
const utils = require('./utils')

const setAssociatedMovementPending = async (movementKey, movementType) => {
  await admin.database().ref(utils.path(movementType)).child(movementKey).update({
    associatedMovement: null
  })
}

const loadMovement = async (movementKey, movementType) => {
  const movementSnapshot = await admin.database()
    .ref(path(movementType)).child(movementKey).
    once('value')
  if (movementSnapshot.exists()) {
    const movement = movementSnapshot.val()
    movement.key = movementKey
    movement.type = movementType
    return movement
  }
  return null
}

const loadAndUpdateAssociatedMovement = async (
  movementKey, movementType, aircraftMovements, updatedMovements, isHomeBase
) => {
  const movement = await loadMovement(movementKey, movementType)
  if (movement) {
    await updateAssociatedMovement(movement, aircraftMovements, updatedMovements, isHomeBase)
  }
}

const updateAssociatedMovement = async (movement, aircraftMovements, updatedMovements, isHomeBase) => {
  functions.logger.log(`Updating associated movement for ${movement.type} ${movement.key}`)

  if (updatedMovements[movement.key]) {
    return
  }

  const oldAssociatedMovementOfMovement = movement.associatedMovement

  await setAssociatedMovementPending(movement.key, movement.type)

  const associatedMovement = utils.getAssociatedMovement(movement, isHomeBase, aircraftMovements)

  const oldAssociatedMovementOfAssociatedMovement = associatedMovement ? associatedMovement.associatedMovement : null

  await utils.setAssociatedMovement(movement.key, movement.type, associatedMovement)
  if (associatedMovement) {
    await utils.setAssociatedMovement(associatedMovement.key, associatedMovement.type, {
      key: movement.key,
      type: movement.type
    })
  }

  updatedMovements[movement.key] = true

  if (associatedMovement) {
    functions.logger.log(
      `Updated ${movement.type} ${movement.key} with new associated ${associatedMovement.type} ${associatedMovement.key}`
    )
  } else {
    functions.logger.log(
      `Updated ${movement.type} ${movement.key} with new associated movement missing`
    )
  }

  if (
    oldAssociatedMovementOfMovement &&
    ['departure', 'arrival'].includes(oldAssociatedMovementOfMovement.type)
  ) {
    await loadAndUpdateAssociatedMovement(
      oldAssociatedMovementOfMovement.key,
      oldAssociatedMovementOfMovement.type,
      aircraftMovements,
      updatedMovements,
      isHomeBase
    )
  }

  if (
    oldAssociatedMovementOfAssociatedMovement &&
    ['departure', 'arrival'].includes(oldAssociatedMovementOfAssociatedMovement.type)
  ) {
    await loadAndUpdateAssociatedMovement(
      oldAssociatedMovementOfAssociatedMovement.key,
      oldAssociatedMovementOfAssociatedMovement.type,
      aircraftMovements,
      updatedMovements,
      isHomeBase
    )
  }
}

const isRelevantUpdate = (valuesBefore, valuesAfter) => {
  if (valuesBefore.dateTime !== valuesAfter.dateTime) {
    return true
  }
  if (valuesBefore.departureRoute !== valuesAfter.departureRoute) {
    return true
  }
  if (valuesBefore.arrivalRoute !== valuesAfter.arrivalRoute) {
    return true
  }
  if (valuesBefore.immatriculation !== valuesAfter.immatriculation) {
    return true
  }
  return false
}

const updateOnCreate = async (snap, type) => {
  functions.logger.log(`Setting associated movement for new ${type} ${snap.ref.key}`)

  const movement = snap.val()
  movement.key = snap.ref.key
  movement.type = type

  const aircraftMovements = await utils.loadAircraftMovements(movement.immatriculation)
  const homeBase = await utils.isHomeBase(movement.immatriculation)
  await updateAssociatedMovement(movement, aircraftMovements, {}, homeBase)
}

const updateOnWrite = async (change, type) => {
  const snap = change.after

  functions.logger.log(`Setting associated movement for updated ${type} ${snap.ref.key}`)

  const movement = snap.val()
  movement.key = snap.ref.key
  movement.type = type

  if (isRelevantUpdate(change.before.val(), change.after.val())) {
    await setAssociatedMovementPending(movement.key, movement.type)
    const aircraftMovements = await utils.loadAircraftMovements(movement.immatriculation)
    const homeBase = await utils.isHomeBase(movement.immatriculation)
    await updateAssociatedMovement(movement, aircraftMovements, {}, homeBase)
  }
}

const updateOnDelete = async (snap, type) => {
  functions.logger.log(`Setting associated movement for deleted ${type} ${snap.ref.key}`)

  const movement = snap.val()

  if (movement.associatedMovement && ['departure', 'arrival'].includes(movement.associatedMovement.type)) {
    await setAssociatedMovementPending(movement.associatedMovement.key, movement.associatedMovement.type)
    const associatedMovement = await loadMovement(movement.associatedMovement.key, movement.associatedMovement.type)
    const aircraftMovements = await utils.loadAircraftMovements(associatedMovement.immatriculation)
    const homeBase = await utils.isHomeBase(movement.immatriculation)
    await updateAssociatedMovement(associatedMovement, aircraftMovements, {
      [snap.ref.key]: true
    }, homeBase)
  }
}

module.exports.setAssociatedMovementOnCreatedDeparture =
  functions.database.ref('/departures/{departureId}')
    .onCreate(snap => updateOnCreate(snap, 'departure'))

module.exports.setAssociatedMovementOnCreatedArrival =
  functions.database.ref('/arrivals/{arrivalId}')
    .onCreate(snap => updateOnCreate(snap, 'arrival'))

module.exports.setAssociatedMovementOnUpdatedDeparture =
  functions.database.ref('/departures/{departureId}')
    .onWrite(change => updateOnWrite(change, 'departure'))

module.exports.setAssociatedMovementOnUpdatedArrival =
  functions.database.ref('/arrivals/{arrivalId}')
    .onWrite(change => updateOnWrite(change, 'arrival'))

module.exports.setAssociatedMovementOnDeletedDeparture =
  functions.database.ref('/departures/{departureId}')
    .onDelete(snap => updateOnDelete(snap, 'departure'))

module.exports.setAssociatedMovementOnDeletedArrival =
  functions.database.ref('/arrivals/{arrivalId}')
    .onDelete(snap => updateOnDelete(snap, 'arrival'))
