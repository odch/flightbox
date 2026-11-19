'use strict';

const { buildRules } = require('../../tasks/processFirebaseRules');

// The RTDB *emulator's* regex engine rejects the production `messages` email
// `.validate` (it uses `\s`), though production accepts it. Neutralize only
// those regex validates for the emulator load — they are unrelated to the
// movement rules under test.
function sanitizeForEmulator(node) {
  if (node && typeof node === 'object') {
    for (const key of Object.keys(node)) {
      if (key === '.validate' && typeof node[key] === 'string' && node[key].includes('\\s')) {
        node[key] = 'newData.isString()';
      } else {
        sanitizeForEmulator(node[key]);
      }
    }
  }
}

// The built database rules of a project config, as JSON for the emulator.
function emulatorRulesFor(config) {
  const rules = buildRules(config);
  sanitizeForEmulator(rules);
  return JSON.stringify(rules);
}

module.exports = { sanitizeForEmulator, emulatorRulesFor };
