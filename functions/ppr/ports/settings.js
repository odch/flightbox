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
 * @property {function(): Promise<*>} getRetentionDays
 *   The stored retention in days as it is (null if none set).
 * @property {function(): Promise<{answerMode: *, pilotInfo: *, closures: *, manualAnswers: *}>} getAnswerSettings
 *   How new requests are answered, as stored (null for what isn't set).
 * @property {function(Object): Promise<void>} saveSettings
 *   Saves the given settings in one write, the others stay as they are:
 *   adminEmail, retentionDays (null removes them), answerMode ('manual' or
 *   'automatic'), pilotInfo (null removes it), closures ({ from, to, reason };
 *   an empty list removes them) and manualAnswers ({ helicopters, mtowFrom };
 *   both off removes them).
 */

module.exports = {}
