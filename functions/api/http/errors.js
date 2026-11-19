'use strict';

const logger = require('firebase-functions/logger');

// Error codes of the API envelope and their HTTP status (same family as
// the Google API / Firebase error codes).
const STATUS_BY_CODE = Object.freeze({
  'invalid-argument': 400,
  unauthenticated: 401,
  'permission-denied': 403,
  'not-found': 404,
  'failed-precondition': 409,
  'resource-exhausted': 429,
  internal: 500,
});

const INTERNAL_MESSAGE = 'Internal error';

class ApiError extends Error {
  constructor(code, message, details) {
    if (!Object.prototype.hasOwnProperty.call(STATUS_BY_CODE, code)) {
      throw new TypeError(`Unknown API error code: ${code}`);
    }
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = STATUS_BY_CODE[code];
    if (details !== undefined) {
      this.details = details;
    }
  }
}

// `validationErrors` is a list of {field, reason}.
function validationError(validationErrors, message = 'Validation failed') {
  return new ApiError('invalid-argument', message, {
    reason: 'validation-failed',
    validationErrors,
  });
}

// Errors of express.json() / body-parser that are the caller's fault.
const BODY_PARSER_REASONS = Object.freeze({
  'entity.parse.failed': 'malformed-body',
  'entity.too.large': 'body-too-large',
  'encoding.unsupported': 'unsupported-encoding',
  'charset.unsupported': 'unsupported-encoding',
});

function toClientError(error) {
  if (error instanceof ApiError && error.code !== 'internal') {
    return error;
  }
  const bodyReason = error && BODY_PARSER_REASONS[error.type];
  if (bodyReason) {
    return new ApiError('invalid-argument', 'Malformed request body', {
      reason: bodyReason,
    });
  }
  return null;
}

function envelope(error) {
  const body = { code: error.code, message: error.message };
  if (error.details !== undefined) {
    body.details = error.details;
  }
  return { error: body };
}

function logInternalError(req, error) {
  logger.error('API request failed', {
    requestId: req && req.requestId,
    method: req && req.method,
    path: req && req.path,
    error: error instanceof Error ? error.stack || error.message : error,
  });
}

/**
 * Answers `error` in the envelope {error: {code, message, details?}}. An
 * ApiError keeps its code, message and details; anything else (and an
 * ApiError with code 'internal') is logged and answered as a generic
 * internal error, so messages and stack traces never reach the client.
 */
function sendError(req, res, error) {
  const clientError = toClientError(error);
  if (!clientError) {
    logInternalError(req, error);
  }
  if (res.headersSent) {
    return;
  }
  const answer =
    clientError || new ApiError('internal', INTERNAL_MESSAGE);
  res.status(answer.status).json(envelope(answer));
}

// Express error-handling middleware for routers that use the envelope.
// eslint-disable-next-line no-unused-vars
function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    // Let Express close the connection of a half-sent response.
    logInternalError(req, error);
    return next(error);
  }
  sendError(req, res, error);
}

module.exports = {
  ApiError,
  STATUS_BY_CODE,
  validationError,
  sendError,
  errorHandler,
};
