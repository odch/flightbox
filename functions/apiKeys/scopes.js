'use strict';

// Permissions an API key can have. A key gets only the scopes the admin
// chose when creating it; new features add scopes, existing keys never gain
// them automatically.
const SCOPES = Object.freeze({
  REPORTS_AIRSTAT: 'reports:airstat',
  // The airstat report with the additional columns (names, e-mails, remarks,
  // invoice recipients). Only together with REPORTS_AIRSTAT.
  REPORTS_AIRSTAT_INTERNAL: 'reports:airstat:internal',
});

// The scopes keys can get on this tenant, by enabled feature.
function availableScopes(projectConfig) {
  if (projectConfig.reportApiEnabled === true) {
    return [SCOPES.REPORTS_AIRSTAT, SCOPES.REPORTS_AIRSTAT_INTERNAL];
  }
  return [];
}

module.exports = { SCOPES, availableScopes };
