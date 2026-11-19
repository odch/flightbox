'use strict';

// Test helper: runs one write case through the domain the way the API will
// (prepareWrite -> validateMovement -> checkWriteAccess) and returns the
// combined decision.

const { prepareWrite } = require('../prepareWrite');
const { validateMovement } = require('../validateMovement');
const { checkWriteAccess } = require('../checkWriteAccess');

function decide(policy, testCase) {
  const { type, op, actor, existing = null, input, settings = {}, customsBaseUrl } = testCase;
  if (op === 'delete') {
    const access = checkWriteAccess({ actor, existing, next: null, policy, settings });
    return { ok: access.ok, errors: [], access, prepared: null };
  }
  const prepared = prepareWrite({ type, actor, existing: op === 'create' ? null : existing, input });
  const errors = validateMovement(type, prepared.movement, policy, {
    customsBaseUrl,
    writtenFields: prepared.writtenFields,
  });
  const access = checkWriteAccess({
    actor,
    existing: op === 'create' ? null : existing,
    next: prepared.movement,
    policy,
    settings,
  });
  return { ok: errors.length === 0 && access.ok, errors, access, prepared };
}

module.exports = { decide };
