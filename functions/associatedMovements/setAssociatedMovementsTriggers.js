const functions = require('firebase-functions')
const admin = require('firebase-admin')
const utils = require('./utils')

const toValidAssoc = data =>
  data && ['departure', 'arrival'].includes(data.type) ? data : null

const setAssociatedMovementPending = async (movementKey, movementType) => {
  await admin.database().ref(utils.path(movementType)).child(movementKey).update({
    associatedMovement: null
  })
}

const loadMovement = async (movementKey, movementType) => {
  const movementsPath = movementType === 'departure' ? '/departures' : '/arrivals'
  const movementSnapshot = await admin.database()
    .ref(movementsPath).child(movementKey)
    .once('value')
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

  // Read old association before any writes so cascade can clean up the previous partner
  const oldMovAssocSnap = await admin.database()
    .ref(utils.path(movement.type)).child(movement.key).once('value')
  const oldAssociatedMovementOfMovement = toValidAssoc(oldMovAssocSnap.val())

  await setAssociatedMovementPending(movement.key, movement.type)

  const associatedMovement = utils.getAssociatedMovement(movement, isHomeBase, aircraftMovements)

  // Read the new partner's current association before overwriting it
  let oldAssociatedMovementOfAssociatedMovement = null
  if (associatedMovement) {
    const oldAssocOfAssocSnap = await admin.database()
      .ref(utils.path(associatedMovement.type)).child(associatedMovement.key).once('value')
    oldAssociatedMovementOfAssociatedMovement = toValidAssoc(oldAssocOfAssocSnap.val())
  }

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

  if (oldAssociatedMovementOfMovement) {
    await loadAndUpdateAssociatedMovement(
      oldAssociatedMovementOfMovement.key,
      oldAssociatedMovementOfMovement.type,
      aircraftMovements,
      updatedMovements,
      isHomeBase
    )
  }

  if (oldAssociatedMovementOfAssociatedMovement) {
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
  // onWrite fires for creates, updates, and deletes. Skip creates and deletes
  // — those are handled by the dedicated onCreate and onDelete triggers.
  if (!change.before.val() || !change.after.val()) return

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

  const movementKey = snap.ref.key

  const assocSnap = await admin.database().ref(utils.path(type)).child(movementKey).once('value')
  const assocData = toValidAssoc(assocSnap.val())

  await admin.database().ref(utils.path(type)).child(movementKey).remove()

  if (assocData) {
    await setAssociatedMovementPending(assocData.key, assocData.type)
    const associatedMovement = await loadMovement(assocData.key, assocData.type)
    if (associatedMovement) {
      const aircraftMovements = await utils.loadAircraftMovements(associatedMovement.immatriculation)
      const homeBase = await utils.isHomeBase(associatedMovement.immatriculation)
      await updateAssociatedMovement(associatedMovement, aircraftMovements, {
        [movementKey]: true // prevent cascade from trying to reload the deleted movement
      }, homeBase)
    }
  }
}

const instance = functions.config().rtdb.instance;

module.exports.setAssociatedMovementOnCreatedDeparture =
  functions.region('europe-west1').database.instance(instance).ref('/departures/{departureId}')
    .onCreate(snap => updateOnCreate(snap, 'departure'))

module.exports.setAssociatedMovementOnCreatedArrival =
  functions.region('europe-west1').database.instance(instance).ref('/arrivals/{arrivalId}')
    .onCreate(snap => updateOnCreate(snap, 'arrival'))

module.exports.setAssociatedMovementOnUpdatedDeparture =
  functions.region('europe-west1').database.instance(instance).ref('/departures/{departureId}')
    .onWrite(change => updateOnWrite(change, 'departure'))

module.exports.setAssociatedMovementOnUpdatedArrival =
  functions.region('europe-west1').database.instance(instance).ref('/arrivals/{arrivalId}')
    .onWrite(change => updateOnWrite(change, 'arrival'))

module.exports.setAssociatedMovementOnDeletedDeparture =
  functions.region('europe-west1').database.instance(instance).ref('/departures/{departureId}')
    .onDelete(snap => updateOnDelete(snap, 'departure'))

module.exports.setAssociatedMovementOnDeletedArrival =
  functions.region('europe-west1').database.instance(instance).ref('/arrivals/{arrivalId}')
    .onDelete(snap => updateOnDelete(snap, 'arrival'))
