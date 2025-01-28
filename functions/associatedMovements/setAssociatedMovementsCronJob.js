const functions = require('firebase-functions')
const admin = require('firebase-admin')
const utils = require('./utils')

// Migration job to set missing associated movements.
// Manually run the task here https://console.cloud.google.com/cloudscheduler
//
// The job is scheduled nightly if `maintenance.setAssociatedMovementsCronJobEnabled` is set to true in the database.
// However, in general it should be disabled after the migration has been executed successfully once (for cost reasons)

const handleImmatriculation = async (immatriculation, movements) => {
  const aircraftMovements = await utils.loadAircraftMovements(immatriculation)
  const homeBase = await utils.isHomeBase(immatriculation)

  const aircraftMovementsWithoutAssociation = movements.filter(movement => movement.immatriculation === immatriculation)

  functions.logger.log(`Start setting associated movements for ${aircraftMovementsWithoutAssociation.length} movements of immatriculation ${immatriculation}`)

  for (const movement of aircraftMovementsWithoutAssociation) {
    const associatedMovement = utils.getAssociatedMovement(movement, homeBase, aircraftMovements)
    await utils.setAssociatedMovement(movement.key, movement.type, associatedMovement)
    functions.logger.log(`Set associated movement for ${movement.type} ${movement.key} (${movement.immatriculation})`)
  }

  functions.logger.log(`Done setting associated movements for ${aircraftMovementsWithoutAssociation.length} movements of immatriculation ${immatriculation}`)
}

const loadWithoutAssociation = async path => {
  const allMovements = await admin.database()
    .ref(path)
    .once("value")

  functions.logger.log(`Total ${allMovements.numChildren()} movements found`)

  const associations = await admin.database()
    .ref('/movementAssociations' + path)
    .once("value")

  functions.logger.log(`Total ${associations.numChildren()} associations found`)

  const presentKeys = new Set()

  associations.forEach(snapshot => {
    presentKeys.add(snapshot.ref.key)
  })

  const movementsWithoutAssociation = []

  allMovements.forEach(snapshot => {
    if (!presentKeys.has(snapshot.ref.key)) {
      movementsWithoutAssociation.push(snapshot)
    }
  })

  functions.logger.log(`Total ${movementsWithoutAssociation.length} movements without association found`)

  return movementsWithoutAssociation
}

exports.setAssociatedMovementsCronJob = functions
  .runWith({
    timeoutSeconds: 540, // default of 1min not enough for big collections
    memory: '512MB' // default of 256MB not enough for big collections
  })
  .pubsub
  .schedule('0 15 * * 0') // midnight on sunday in Europe (in pacific time)
  .onRun(async () => {
    functions.logger.log('Starting job')

    const enabled = await admin.database()
      .ref('/settings/setAssociatedMovementsCronJobEnabled')
      .once("value")
    if (enabled.val() !== true) {
      functions.logger.log('Job is not enabled. Aborting...')
      return
    }

    const loadedMovements = await Promise.all([
      loadWithoutAssociation('/departures'),
      loadWithoutAssociation('/arrivals')
    ])

    const departures = loadedMovements[0]
    const arrivals = loadedMovements[1]

    const movements = []

    departures.forEach(utils.addWithType(movements, 'departure'))
    arrivals.forEach(utils.addWithType(movements, 'arrival'))

    movements.sort(utils.compareDescending)

    functions.logger.log('Movements found without associated movement: ' + movements.length)

    const handledImmatriculations = new Set()

    for (const movement of movements) {
      if (!handledImmatriculations.has(movement.immatriculation)) {
        await handleImmatriculation(movement.immatriculation, movements)
        handledImmatriculations.add(movement.immatriculation)
      }
    }

    functions.logger.log('Associated movements set')
  })
