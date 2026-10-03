'use strict';

const fs = require('fs');
const path = require('path');
const logger = require('firebase-functions/logger');

// Tenant config written at deploy time by tasks/generateServerConfig.js (see
// .github/workflows). Without it, or when it was generated for another
// Firebase project (e.g. a stale file on a manual deploy), the features that
// need it stay disabled. Never throws: every function loads this.

const CONFIG_FILE = path.join(__dirname, 'project-config.generated.json');
const DISABLED = Object.freeze({ reportApiEnabled: false });

function runtimeProjectId(env) {
  if (env.GCLOUD_PROJECT) {
    return env.GCLOUD_PROJECT;
  }
  try {
    return JSON.parse(env.FIREBASE_CONFIG).projectId;
  } catch (e) {
    return undefined;
  }
}

function loadProjectConfig({ file = CONFIG_FILE, env = process.env } = {}) {
  let config;
  try {
    config = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    // Expected locally, in the emulator and in specs; in a deployed function
    // it means the deploy did not generate the file.
    if (e.code !== 'ENOENT' || (env.K_SERVICE && env.FUNCTIONS_EMULATOR !== 'true')) {
      logger.error(`Project config not loaded, tenant features disabled: ${e.message}`);
    }
    return DISABLED;
  }

  if (config === null || typeof config !== 'object' || config.reportApiEnabled !== true) {
    return DISABLED;
  }
  const projectId = runtimeProjectId(env);
  if (config.firebaseProjectId !== projectId) {
    logger.error(`Project config is not for project ${projectId}, tenant features disabled`);
    return DISABLED;
  }
  return config;
}

module.exports = { loadProjectConfig };
