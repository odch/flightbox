'use strict';

const { randomUUID } = require('crypto');

const REQUEST_ID_HEADER = 'X-Request-Id';

// Incoming ids are echoed into headers and logs, so only short, plain
// tokens are accepted (e.g. UUIDs or hex trace ids).
const ACCEPTED_REQUEST_ID = /^[A-Za-z0-9_-]{8,64}$/;

function resolveRequestId(incoming, generate = randomUUID) {
  return typeof incoming === 'string' && ACCEPTED_REQUEST_ID.test(incoming)
    ? incoming
    : generate();
}

// Sets req.requestId and the X-Request-Id response header.
function requestId(req, res, next) {
  req.requestId = resolveRequestId(req.get(REQUEST_ID_HEADER));
  res.set(REQUEST_ID_HEADER, req.requestId);
  next();
}

module.exports = { requestId, resolveRequestId, REQUEST_ID_HEADER };
