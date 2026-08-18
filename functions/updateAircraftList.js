const { onSchedule } = require('firebase-functions/v2/scheduler');
const admin = require('firebase-admin');

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

// The upstream feed lives in a mutable GitHub branch. A truncated, empty or
// tampered feed would mark every existing entry for deletion, so never remove
// more than this fraction of the table in a single run once it holds a
// meaningful number of entries.
const MAX_DELETE_FRACTION = 0.1;
const DELETE_GUARD_MIN_EXISTING = 50;

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
      if (!aircraft || !aircraft.registration) {
        return
      }

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
 * Guards against a truncated or poisoned upstream feed wiping the table.
 * Small tables (initial seeding, tests) are exempt so legitimate churn is not
 * blocked; once the table is sizeable, refuse runs that would delete more than
 * MAX_DELETE_FRACTION of it.
 * @param {number} existingCount - Number of entries currently in the database
 * @param {number} removalCount - Number of entries the run would delete
 * @returns {boolean} true when the removals are within safe bounds
 */
function removalsWithinSafeBounds(existingCount, removalCount) {
  if (existingCount < DELETE_GUARD_MIN_EXISTING) {
    return true;
  }
  return removalCount / existingCount <= MAX_DELETE_FRACTION;
}

/**
 * Scheduled Cloud Function to synchronize aircraft data with GitHub repository
 */
exports.scheduledAircraftListUpdate = onSchedule(
  { region: 'europe-west1', schedule: SCHEDULE, timeZone: TIMEZONE },
  async () => {
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

      // A valid feed always contains entries. An empty result means the source
      // is unreachable, empty or corrupt; applying it would mark every existing
      // aircraft for deletion, so skip the sync entirely.
      if (importedRegistrations.size === 0) {
        console.error('Aircraft list sync skipped: imported feed contained no valid entries');
        return null;
      }

      const existingAircraftList = (await db.ref('aircrafts').once('value')).val() || {};
      const existingRegistrations = Object.keys(existingAircraftList);
      const aircraftItemsToRemove = getAircraftItemsToRemove(
        new Set(existingRegistrations),
        importedRegistrations
      );

      // Refuse a run that would delete a large share of the table; a partial or
      // poisoned feed is the likely cause, not legitimate churn.
      if (!removalsWithinSafeBounds(existingRegistrations.length, aircraftItemsToRemove.length)) {
        console.error(
          `Aircraft list sync skipped: refusing to remove ${aircraftItemsToRemove.length} of ` +
          `${existingRegistrations.length} aircraft (exceeds ${MAX_DELETE_FRACTION * 100}% safety limit)`
        );
        return null;
      }

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
  }
);
