const SCOPE_AIRSTAT = 'reports:airstat';
const SCOPE_AIRSTAT_INTERNAL = 'reports:airstat:internal';

// i18n keys of the scope labels (scope names contain ':', which i18next
// reads as a namespace separator, so they cannot be keys themselves).
const SCOPE_LABEL_KEYS: Record<string, string> = {
  [SCOPE_AIRSTAT]: 'apiAccess.scope.reportsAirstat',
  [SCOPE_AIRSTAT_INTERNAL]: 'apiAccess.scope.reportsAirstatInternal',
};

// A scope that can only be granted together with another one.
export const REQUIRED_SCOPES: Record<string, string> = {
  [SCOPE_AIRSTAT_INTERNAL]: SCOPE_AIRSTAT,
};

// Scopes that deliver personal data and need confirmPersonalData: true.
const PERSONAL_DATA_SCOPES = [SCOPE_AIRSTAT_INTERNAL];

export const scopeLabel = (t: (key: string) => string, scope: string): string =>
  SCOPE_LABEL_KEYS[scope] ? String(t(SCOPE_LABEL_KEYS[scope])) : scope;

export const requiresPersonalDataConfirmation = (scopes: string[]): boolean =>
  scopes.some(scope => PERSONAL_DATA_SCOPES.includes(scope));

// Checking a scope adds it; unchecking one also removes the scopes that
// require it (e.g. unchecking the base airstat scope drops the internal one).
export const toggleScope = (scopes: string[], scope: string, checked: boolean): string[] => {
  if (checked) {
    return scopes.includes(scope) ? scopes : [...scopes, scope];
  }
  return scopes.filter(s => s !== scope && REQUIRED_SCOPES[s] !== scope);
};
