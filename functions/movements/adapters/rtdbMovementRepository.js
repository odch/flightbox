'use strict';

const { getDatabase } = require('firebase-admin/database');
const { createDatabaseRestClient } = require('./databaseRest');

// Realtime Database implementation of the movement repository port (see
// functions/movements/application/saveMovement.js).
//
// Reads use the Admin SDK: they only feed the server's own checks and never
// reach the caller. Writes go through the REST API as the caller
// (auth_variable_override), so the database rules apply to them exactly as
// they apply to the web client's direct writes today.

const PATHS = Object.freeze({ departure: 'departures', arrival: 'arrivals' });

function pathOf(type) {
  if (!Object.prototype.hasOwnProperty.call(PATHS, type)) {
    throw new TypeError(`Unknown movement type: ${JSON.stringify(type)}`);
  }
  return PATHS[type];
}

/**
 * The `auth` the database rules see for the caller, as the client SDK would
 * present it: the uid (admins are recognised by /admins/<uid>, guest and
 * kiosk by their fixed uids) and the token's e-mail, if any.
 */
function authOverrideFor(actor) {
  const token = typeof actor.email === 'string' && actor.email !== '' ? { email: actor.email } : {};
  return { uid: actor.uid, token };
}

async function readValue(db, path) {
  const snapshot = await db.ref(path).once('value');
  return snapshot.val();
}

/**
 * db:   () => Admin SDK database (reads);
 * rest: client of databaseRest.js (writes as the caller).
 */
function createRtdbMovementRepository({ db = getDatabase, rest = createDatabaseRestClient() } = {}) {
  return {
    // The stored movement, or null. `key` must already be a valid key.
    async findMovement(type, key) {
      return readValue(db(), `${pathOf(type)}/${key}`);
    },

    // What the domain needs from /settings for a movement write.
    async loadWriteSettings() {
      const database = db();
      const [lockDate, lockDateIso, customsBaseUrl] = await Promise.all([
        readValue(database, 'settings/lockDate'),
        readValue(database, 'settings/lockDateIso'),
        readValue(database, 'settings/customsDeclarationApp/baseUrl'),
      ]);
      return { lockDate, lockDateIso, customsBaseUrl };
    },

    // push() of the movement as the actor; resolves with the new key.
    async createMovement(type, movement, actor) {
      const answer = await rest.write('POST', pathOf(type), movement, authOverrideFor(actor));
      if (!answer || typeof answer.name !== 'string') {
        throw new Error('Database answered a push without the new key');
      }
      return answer.name;
    },

    // update() of the patch (null removes a field) as the actor.
    async updateMovement(type, key, patch, actor) {
      await rest.write('PATCH', `${pathOf(type)}/${key}`, patch, authOverrideFor(actor));
    },
  };
}

module.exports = { createRtdbMovementRepository, authOverrideFor };
