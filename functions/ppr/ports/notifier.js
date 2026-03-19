'use strict'

/**
 * PPR Notifier Port
 *
 * Interface for sending PPR-related notifications.
 * Implementations: emailNotifier (current), push/SMS (future).
 *
 * @typedef {Object} PprNotifier
 * @property {function(Object, string): Promise<void>} notifyRequestSubmitted
 *   Notify admin that a new PPR request was submitted.
 *   Args: (pprRequest, adminEmail)
 * @property {function(Object): Promise<void>} notifyRequestReviewed
 *   Notify pilot that their PPR request was approved or rejected.
 *   Args: (pprRequest) — must include status, email, and review metadata.
 */

module.exports = {}
