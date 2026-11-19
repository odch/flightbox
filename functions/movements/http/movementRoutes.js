'use strict';

const express = require('express');
const { getAuth } = require('firebase-admin/auth');
const { getDatabase } = require('firebase-admin/database');
const logger = require('firebase-functions/logger');
const { requestId } = require('../../api/http/requestId');
const { appAuth } = require('../../api/http/appAuth');
const { asyncRoute } = require('../../api/http/asyncRoute');
const { ApiError, validationError, sendError } = require('../../api/http/errors');
const { buildMovementPolicy } = require('../domain');
const { saveMovement, OUTCOMES } = require('../application/saveMovement');
const { createRtdbMovementRepository } = require('../adapters/rtdbMovementRepository');
const { RulesRejectedError } = require('../adapters/databaseRest');

// App API for movement writes (flag movementWritesViaApi): the web app's
// replacement for writing departures and arrivals to the database directly.

const CREATE_PATHS = ['/app/movements/:type', '/api/app/movements/:type'];
const UPDATE_PATHS = ['/app/movements/:type/:key', '/api/app/movements/:type/:key'];

const TYPES_BY_PATH = Object.freeze({ departures: 'departure', arrivals: 'arrival' });

// The characters of push keys (-0-9A-Za-z_). Anything else is no key the app
// creates, so no movement this API knows.
const MOVEMENT_KEY = /^[-0-9A-Za-z_]{1,128}$/;

// A movement is a few KB. Cloud Functions parses bodies of up to 1 GB
// itself before these routes run, so the limits are checked here as well.
const BODY_LIMIT_BYTES = 64 * 1024;

// No movement field nests deeper than paymentMethod (level 2), and a
// movement has about 40 fields. Bounding both keeps the domain's recursive
// checks safe and the list of validation errors short.
const MAX_BODY_DEPTH = 8;
const MAX_BODY_FIELDS = 100;

const MESSAGES = Object.freeze({
  [OUTCOMES.NOT_FOUND]: 'Movement not found',
  'permission-denied': 'Not allowed to write this movement',
  'failed-precondition': 'Movement is locked',
});

function movementTypeOf(req) {
  const { type } = req.params;
  if (!Object.prototype.hasOwnProperty.call(TYPES_BY_PATH, type)) {
    throw new ApiError('not-found', 'Unknown movement type', { reason: 'unknown-movement-type' });
  }
  return TYPES_BY_PATH[type];
}

function movementKeyOf(req) {
  const { key } = req.params;
  if (!MOVEMENT_KEY.test(key)) {
    throw new ApiError('not-found', MESSAGES[OUTCOMES.NOT_FOUND], { reason: OUTCOMES.NOT_FOUND });
  }
  return key;
}

const invalidBody = message => new ApiError('invalid-argument', message, { reason: 'invalid-body' });

const isObject = value => value !== null && typeof value === 'object';

// Only what JSON.parse makes: not a Buffer (Cloud Functions parses any
// content type) nor another class instance.
function isJsonObject(value) {
  if (!isObject(value) || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

// Walks level by level, without recursion, so a deeply nested body cannot
// exhaust the stack here either.
function isNestedDeeperThan(value, maxDepth) {
  let level = [value];
  let depth = 0;
  while (level.length > 0) {
    depth += 1;
    if (depth > maxDepth) {
      return true;
    }
    level = level.flatMap(object => Object.values(object).filter(isObject));
  }
  return false;
}

function inputOf(req) {
  const { body } = req;
  if (!isJsonObject(body)) {
    throw invalidBody('The body must be a JSON object');
  }
  if (Object.keys(body).length > MAX_BODY_FIELDS) {
    throw invalidBody('The body has too many fields');
  }
  if (isNestedDeeperThan(body, MAX_BODY_DEPTH)) {
    throw invalidBody('The body is nested too deeply');
  }
  return body;
}

function toApiError(result) {
  if (result.code === OUTCOMES.INVALID) {
    return validationError(result.validationErrors);
  }
  return new ApiError(result.code, MESSAGES[result.code], { reason: result.reason });
}

// Under Cloud Functions the body arrives parsed (any content type, up to
// 1 GB; req.rawBody holds the bytes) and the parser below does nothing, so
// the content type and size are checked first. Elsewhere the parser reads
// the body and enforces the limit itself. Errors go into the envelope.
function jsonBody() {
  const parse = express.json({ limit: BODY_LIMIT_BYTES });
  return (req, res, next) => {
    if (!req.is('application/json')) {
      sendError(req, res, invalidBody('The body must be a JSON object'));
      return;
    }
    if (req.rawBody && req.rawBody.length > BODY_LIMIT_BYTES) {
      sendError(req, res, new ApiError('invalid-argument', 'Malformed request body', {
        reason: 'body-too-large',
      }));
      return;
    }
    parse(req, res, error => (error ? sendError(req, res, error) : next()));
  };
}

// Built on first use: a config without the policy fields must not break
// loading the api function, only these routes (500, logged).
function lazyPolicy(config) {
  let policy;
  return () => {
    if (!policy) {
      policy = buildMovementPolicy(config);
    }
    return policy;
  };
}

// The domain accepted the write, the database rules did not: the two
// disagree, which needs fixing. The caller gets a plain internal error.
function logRulesDisagreement(req, { type, key }) {
  logger.error('Movement write rejected by database rules after the domain accepted it', {
    requestId: req.requestId,
    type,
    key,
    uid: req.actor.uid,
    fields: Object.keys(req.body),
  });
}

function saveHandler({ repository, policy, isCreate }) {
  return asyncRoute(async (req, res) => {
    const type = movementTypeOf(req);
    const key = isCreate ? null : movementKeyOf(req);
    const input = inputOf(req);
    let result;
    try {
      result = await saveMovement({ repository, policy: policy(), actor: req.actor, type, key, input });
    } catch (error) {
      if (error instanceof RulesRejectedError) {
        logRulesDisagreement(req, { type, key });
        throw new ApiError('internal', 'Internal error');
      }
      throw error;
    }
    if (!result.ok) {
      throw toApiError(result);
    }
    res.status(result.created ? 201 : 200).json({ key: result.key });
  });
}

/**
 * Registers POST /app/movements/:type (create) and PATCH
 * /app/movements/:type/:key (update, merged like RTDB update()), also under
 * /api, for the Firebase ID token of a signed-in user. Answers 201/200
 * {key}; errors in the envelope of functions/api/http/errors.js.
 */
function registerMovementRoutes(app, config, {
  auth = getAuth,
  db = getDatabase,
  repository = createRtdbMovementRepository({ db }),
} = {}) {
  const policy = lazyPolicy(config);
  const common = [requestId, appAuth({ auth, db }), jsonBody()];
  app.post(CREATE_PATHS, ...common, saveHandler({ repository, policy, isCreate: true }));
  app.patch(UPDATE_PATHS, ...common, saveHandler({ repository, policy, isCreate: false }));
}

module.exports = { registerMovementRoutes, CREATE_PATHS, UPDATE_PATHS };
