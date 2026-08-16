const { onSchedule } = require('firebase-functions/v2/scheduler');
const admin = require('firebase-admin');

const AERODROMES_URL = 'https://raw.githubusercontent.com/odch/aerodromes/refs/heads/main/aerodromes.json';
const SCHEDULE = '0 3 * * 3'; // Every Wednesday at 3 AM
const TIMEZONE = 'Europe/Zurich';

// The upstream feed lives in a mutable GitHub branch. A truncated, empty or
// tampered feed would mark every existing entry for deletion, so never remove
// more than this fraction of the table in a single run once it holds a
// meaningful number of entries.
const MAX_DELETE_FRACTION = 0.1;
const DELETE_GUARD_MIN_EXISTING = 50;

const EUROPEAN_COUNTRIES = new Set([
  'AL', 'AD', 'AM', 'AT', 'AZ', 'BY', 'BE', 'BA', 'BG', 'HR', 'CY', 'CZ',
  'DK', 'EE', 'FI', 'FR', 'GE', 'DE', 'GR', 'HU', 'IS', 'IE', 'IT', 'KZ',
  'XK', 'LV', 'LI', 'LT', 'LU', 'MT', 'MD', 'MC', 'ME', 'NL', 'MK', 'NO',
  'PL', 'PT', 'RO', 'RU', 'SM', 'RS', 'SK', 'SI', 'ES', 'SE', 'CH', 'TR',
  'UA', 'GB', 'VA'
]);

/**
 * Fetches aerodrome data from the GitHub repository
 * @returns {Promise<Array>} Array of aerodrome objects
 */
async function fetchAerodromes() {
  const response = await fetch(AERODROMES_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch aerodromes: ${response.statusText}`);
  }
  const data = await response.json();
  return data.aerodromes || [];
}

/**
 * Processes aerodrome data and prepares updates for Firebase
 * @param {Array} aerodromes - Array of aerodrome objects
 * @returns {Object} Object containing updates and metadata
 */
function processAerodromeUpdates(aerodromes) {
  const updates = {};
  const importedIcaoCodes = new Set();

  aerodromes
    .filter(aero => aero && aero.icao && aero.name && EUROPEAN_COUNTRIES.has(aero.country))
    .forEach(aero => {
      importedIcaoCodes.add(aero.icao);
      updates[aero.icao] = {
        name: aero.name.toUpperCase(),
        country: aero.country,
        timezone: aero.timezone,
        lastUpdated: admin.database.ServerValue.TIMESTAMP
      };
    });

  return { updates, importedIcaoCodes };
}

/**
 * Gets aerodromes to remove by comparing existing and imported ICAO codes
 * @param {Set} existingIcaoCodes - Set of existing ICAO codes in the database
 * @param {Set} importedIcaoCodes - Set of imported ICAO codes
 * @returns {Array} Array of ICAO codes to remove
 */
function getAerodromesToRemove(existingIcaoCodes, importedIcaoCodes) {
  return [...existingIcaoCodes].filter(icao => !importedIcaoCodes.has(icao));
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
 * Scheduled Cloud Function to synchronize aerodromes data with GitHub repository
 */
exports.scheduledAerodromesUpdate = onSchedule(
  { region: 'europe-west1', schedule: SCHEDULE, timeZone: TIMEZONE },
  async () => {
    try {
      const db = admin.database();

      // Check if the cron job is enabled
      const settings = await db.ref('settings/updateAerodromesCronJobEnabled').once('value');
      if (!settings.val()) {
        console.log('Aerodromes update is disabled via settings');
        return null;
      }

      const aerodromes = await fetchAerodromes();

      const { updates, importedIcaoCodes } = processAerodromeUpdates(aerodromes);

      // A valid feed always contains entries. An empty result means the source
      // is unreachable, empty or corrupt; applying it would mark every existing
      // aerodrome for deletion, so skip the sync entirely.
      if (importedIcaoCodes.size === 0) {
        console.error('Aerodromes sync skipped: imported feed contained no valid entries');
        return null;
      }

      const existingAerodromes = (await db.ref('aerodromes').once('value')).val() || {};
      const existingIcaoCodes = Object.keys(existingAerodromes);
      const aerodromesToRemove = getAerodromesToRemove(
        new Set(existingIcaoCodes),
        importedIcaoCodes
      );

      // Refuse a run that would delete a large share of the table; a partial or
      // poisoned feed is the likely cause, not legitimate churn.
      if (!removalsWithinSafeBounds(existingIcaoCodes.length, aerodromesToRemove.length)) {
        console.error(
          `Aerodromes sync skipped: refusing to remove ${aerodromesToRemove.length} of ` +
          `${existingIcaoCodes.length} aerodromes (exceeds ${MAX_DELETE_FRACTION * 100}% safety limit)`
        );
        return null;
      }

      aerodromesToRemove.forEach(icao => { updates[icao] = null; });

      if (Object.keys(updates).length > 0) {
        await db.ref('aerodromes').update(updates);
        console.log(`Synchronized ${importedIcaoCodes.size} aerodromes, removed ${aerodromesToRemove.length}`);
      }

      return null;
    } catch (error) {
      console.error('Aerodromes sync failed:', error);
      throw error;
    }
  }
);
