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
 * @property {function(string, Object): Promise<void>} updateStatus
 *   Update a request's status and review metadata by key.
 * @property {function(string): Promise<Object|null>} findByKey
 *   Retrieve a single request by key. Returns null if not found.
 * @property {function(): Promise<Array<Object>>} findAll
 *   Retrieve all PPR requests, ordered by most recent first.
 * @property {function(string): Promise<Array<Object>>} findByEmail
 *   Retrieve PPR requests created by a specific email address.
 * @property {function(string): Promise<void>} deleteByKey
 *   Delete a PPR request by key.
 */

module.exports = {}
