'use strict'

/**
 * PPR Settings Port
 *
 * Settings the aerodrome's admins manage for PPR.
 * Implementations: firebasePprSettings (current).
 *
 * @typedef {Object} PprSettings
 * @property {function(): Promise<string|null>} getAdminEmail
 *   The address new requests are sent to, or null if none is set.
 * @property {function(string|null): Promise<void>} setAdminEmail
 *   Set the address, or remove it with null.
 * @property {function(): Promise<*>} getRetentionDays
 *   The stored retention in days as it is (null if none set).
 * @property {function(number|null): Promise<void>} setRetentionDays
 *   Set the retention, or remove it with null (nothing is deleted).
 * @property {function(): Promise<{answerMode: *, pilotInfo: *, closures: *}>} getAnswerSettings
 *   How new requests are answered, as stored (null for what isn't set).
 * @property {function(string): Promise<void>} setAnswerMode
 *   'manual' or 'automatic'.
 * @property {function(string|null): Promise<void>} setPilotInfo
 *   The text automatic approvals carry, or null to remove it.
 * @property {function(Array): Promise<void>} setClosures
 *   The closures ({ from, to, reason }); an empty list removes them.
 */

module.exports = {}
