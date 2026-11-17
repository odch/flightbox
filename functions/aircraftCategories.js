'use strict'

// The app's aircraft categories (src/util/aircraftCategoriesData.js) by the
// aircraft types of the register (see updateAircraftList); keep them in sync
const REGISTER_CATEGORIES = {
  'Aeroplane': 'Flugzeug',
  'Homebuilt Airplane': 'Eigenbauflugzeug',
  'Powered Glider': 'Motorsegler',
  'Helicopter': 'Hubschrauber',
  'Homebuilt Helicopter': 'Eigenbauhubschrauber',
  'Glider': 'Segelflugzeug',
  'Homebuild Glider': 'Eigenbausegelflugzeug',
  'Balloon (Hot-air)': 'Ballon (Heissluft)',
  'Balloon (Gas)': 'Ballon (Gas)',
  'Airship (Hot-air)': 'Luftschiff (Heissluft)',
  'Ultralight Gyrocopter': 'Ultraleicht Tragschrauber',
  'Ultralight (3-axis control)': 'Ultraleichtflugzeug (3-Achsen gesteuert)',
  'Trike': 'Trike',
  'Ecolight': 'Ecolight',
  'Homebuilt Gyrocopter': 'Eigenbautragschrauber'
}

const CATEGORIES = Object.values(REGISTER_CATEGORIES)

// As the app tells helicopters (isHelicopter in src/util/aircraftCategories.ts)
const HELICOPTER_CATEGORIES = ['Hubschrauber', 'Eigenbauhubschrauber']

function isHelicopter(category) {
  return HELICOPTER_CATEGORIES.includes(category)
}

module.exports = { REGISTER_CATEGORIES, CATEGORIES, isHelicopter }
