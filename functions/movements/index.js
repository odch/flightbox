'use strict';

// Movement writes through the API (flag movementWritesViaApi). Hexagonal:
//   domain/       pure rules (validation, ownership, lock, merge)
//   application/  the save use case and its repository port
//   adapters/     Realtime Database repository (writes as the caller)
//   http/         Express routes of the app API
// functions/api/index.js requires this module only when the flag is on.

const { registerMovementRoutes } = require('./http/movementRoutes');

module.exports = { registerMovementRoutes };
