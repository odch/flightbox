'use strict'

/**
 * Aerodrome Status Port
 *
 * The status admins set in the "Flugplatz-Status" tab.
 * Implementations: firebaseAerodromeStatus (current).
 *
 * @typedef {Object} AerodromeStatus
 * @property {function(): Promise<{status: string, details: string|null}|null>} getCurrent
 *   The current status ('open', 'restricted' or 'closed') with its details,
 *   or null if none was ever set.
 */

module.exports = {}
