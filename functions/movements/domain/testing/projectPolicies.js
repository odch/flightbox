'use strict';

// Test helper (specs and test/rules only, never required by deployed code):
// the movement policy and the database-rules config of real projects, both
// built from projects/<name>.json the way the deploy builds them.

const projects = require('../../../../projects');
const { buildServerConfig } = require('../../../../tasks/generateServerConfig');
const { buildMovementPolicy } = require('../policy');

// lsze and lszt: personal access (loginForm 'email'); lspv: shared access.
// The lockOnDateTime variant is lsze with the ISO lock switched on, as lspl
// has it in production.
const VARIANTS = Object.freeze({
  lsze: { project: 'lsze', overrides: {} },
  lszt: { project: 'lszt', overrides: {} },
  lspv: { project: 'lspv', overrides: {} },
  'lsze-lockOnDateTime': { project: 'lsze', overrides: { lockOnDateTime: true } },
});

const VARIANT_NAMES = Object.freeze(Object.keys(VARIANTS));

function loadVariant(name, env = 'test') {
  const variant = VARIANTS[name];
  if (!variant) {
    throw new Error(`Unknown policy variant: ${name}`);
  }
  // gulpfile.js builds the rules from projects.load() (top level only); the
  // functions config is the env-merged view of the same file.
  const rulesConfig = { ...projects.load(variant.project), ...variant.overrides };
  const serverConfig = buildServerConfig(variant.project, rulesConfig, env);
  return {
    name,
    project: variant.project,
    rulesConfig,
    serverConfig,
    policy: buildMovementPolicy(serverConfig),
  };
}

module.exports = { VARIANTS, VARIANT_NAMES, loadVariant };
