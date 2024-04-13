const functions = require('firebase-functions')
const admin = require('firebase-admin')
const utils = require('./utils')

// Run once a week at midnight, set missing associated movements
// Manually run the task here https://console.cloud.google.com/cloudscheduler
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

const loadWithoutAssociation = path => admin.database()
  .ref(path)
  .orderByChild("associatedMovement")
  .equalTo(null)
  .once("value")

exports.setAssociatedMovementsCronJob = functions.pubsub
  .schedule('0 15 * * 0') // midnight from sunday to monday in Europe (in pacific time)
  .onRun(async () => {
    functions.logger.log('Starting job')

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
