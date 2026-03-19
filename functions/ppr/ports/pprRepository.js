'use strict'

/**
 * PPR Repository Port
 *
 * Interface for persisting and querying PPR requests.
 * Implementations: firebasePprRepository (current), postgresPprRepository (future).
 *
 * @typedef {Object} PprRepository
 * @property {function(Object): Promise<{key: string}>} save
 *   Persist a new PPR request. Returns the generated key.
 * @property {function(string, function(Object): boolean, Object): Promise<{applied: boolean, request: Object|null}>} updateIf
 *   Atomically merge the given fields into a request if it exists and the
 *   predicate holds for it. Returns whether it was applied and the request
 *   (updated if applied, as found otherwise; null if it doesn't exist).
 * @property {function(): Promise<Array<Object>>} findAll
 *   Retrieve all PPR requests, ordered by most recent first.
 * @property {function(string): Promise<Array<Object>>} findByEmail
 *   Retrieve PPR requests created by a specific email address.
 * @property {function(string, function(Object): boolean): Promise<{applied: boolean, request: Object|null}>} removeIf
 *   Atomically delete a request if it exists and the predicate holds for
 *   it. Returns whether it was deleted and the request as found (null if
 *   it doesn't exist).
 */

module.exports = {}
