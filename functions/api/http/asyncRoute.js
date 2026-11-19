'use strict';

const { sendError } = require('./errors');

/**
 * Wraps an (async) route handler or middleware: a thrown ApiError is
 * answered in the error envelope, anything else as a logged internal
 * error. Works without an error-handling middleware on the app, so routes
 * can be added to the shared API app without changing existing routes.
 */
function asyncRoute(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      sendError(req, res, error);
    }
  };
}

module.exports = { asyncRoute };
