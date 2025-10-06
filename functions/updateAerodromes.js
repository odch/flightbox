const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');

const AERODROMES_URL = 'https://raw.githubusercontent.com/odch/aerodromes/refs/heads/main/aerodromes.json';
const SCHEDULE = '0 3 * * 3'; // Every Wednesday at 3 AM
const TIMEZONE = 'Europe/Zurich';

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
    .filter(aero => EUROPEAN_COUNTRIES.has(aero.country))
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
 * Scheduled Cloud Function to synchronize aerodromes data with GitHub repository
 */
exports.scheduledAerodromesUpdate = functions.pubsub
  .schedule(SCHEDULE)
  .timeZone(TIMEZONE)
  .onRun(async () => {
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
      const existingAerodromes = (await db.ref('aerodromes').once('value')).val() || {};
      const aerodromesToRemove = getAerodromesToRemove(
        new Set(Object.keys(existingAerodromes)),
        importedIcaoCodes
      );

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
  });
