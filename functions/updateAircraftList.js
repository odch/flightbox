const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');

// Note: this map must be kept in sync with the list in `aircraftCategories.js`.
const aircraftCategoryMap = {
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

const AIRCRAFT_LIST_URL = 'https://raw.githubusercontent.com/odch/aircraft-list/refs/heads/main/aircraft.json';
const SCHEDULE = '0 4 * * 3'; // Every Wednesday at 4 AM
const TIMEZONE = 'Europe/Zurich';

/**
 * Fetches aircraft data from the GitHub repository
 * @returns {Promise<Array>} Array of aircraft objects
 */
async function fetchAircraftList() {
  const response = await fetch(AIRCRAFT_LIST_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch aircraft list: ${response.statusText}`);
  }
  const data = await response.json();
  return data.aircraft || [];
}

/**
 * Processes aircraft data and prepares updates for Firebase
 * @param {Array} aircraftList - Array of aircraft objects
 * @returns {Object} Object containing updates and metadata
 */
function processAircraftUpdates(aircraftList) {
  const updates = {};
  const importedRegistrations = new Set();

  aircraftList
    .forEach(aircraft => {
      const category = aircraftCategoryMap[aircraft.aircraft_type]

      if (!category) {
        console.log(`Skipping aircraft ${aircraft.registration} because category ${aircraft.aircraft_type} was not found in our list`)
        return
      }

      const registration = aircraft.registration.replace('-', '')
      const mtow = aircraft.mtom
      const type = aircraft.icao_aircraft_type

      importedRegistrations.add(registration);

      updates[registration] = {
        category,
        mtow,
        type,
        lastUpdated: admin.database.ServerValue.TIMESTAMP
      };
    });

  return { updates, importedRegistrations };
}

/**
 * Gets aircraft items to remove by comparing existing and imported registrations
 * @param {Set} existingRegistrations - Set of existing registrations in the database
 * @param {Set} importedRegistrations - Set of imported registrations
 * @returns {Array} Array of registrations to remove
 */
function getAircraftItemsToRemove(existingRegistrations, importedRegistrations) {
  return [...existingRegistrations].filter(registration => !importedRegistrations.has(registration));
}

/**
 * Scheduled Cloud Function to synchronize aircraft data with GitHub repository
 */
exports.scheduledAircraftListUpdate = functions.region('europe-west1').pubsub
  .schedule(SCHEDULE)
  .timeZone(TIMEZONE)
  .onRun(async () => {
    try {
      const db = admin.database();

      // Check if the cron job is enabled
      const settings = await db.ref('settings/updateAircraftListCronJobEnabled').once('value');
      if (!settings.val()) {
        console.log('Aircraft list update is disabled via settings (set `settings/updateAircraftListCronJobEnabled` to `true` to enable it)');
        return null;
      }

      const aicraftList = await fetchAircraftList();

      const { updates, importedRegistrations } = processAircraftUpdates(aicraftList);
      const existingAircraftList = (await db.ref('aircrafts').once('value')).val() || {};
      const aircraftItemsToRemove = getAircraftItemsToRemove(
        new Set(Object.keys(existingAircraftList)),
        importedRegistrations
      );

      aircraftItemsToRemove.forEach(registration => { updates[registration] = null; });

      if (Object.keys(updates).length > 0) {
        await db.ref('aircrafts').update(updates);
        console.log(`Synchronized ${importedRegistrations.size} aircraft items, removed ${aircraftItemsToRemove.length}`);
      }

      return null;
    } catch (error) {
      console.error('Aircraft list sync failed:', error);
      throw error;
    }
  });
