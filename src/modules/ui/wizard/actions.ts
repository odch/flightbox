export const WIZARD_SET_INITIALIZED = 'WIZARD_SET_INITIALIZED' as const;
export const WIZARD_UPDATE_VALUES = 'WIZARD_UPDATE_VALUES' as const;
export const WIZARD_NEXT_PAGE = 'WIZARD_NEXT_PAGE' as const;
export const WIZARD_PREVIOUS_PAGE = 'WIZARD_PREVIOUS_PAGE' as const;
export const WIZARD_FINISH = 'WIZARD_FINISH' as const;
export const WIZARD_RESET = 'WIZARD_RESET' as const;
export const WIZARD_SHOW_DIALOG = 'WIZARD_SHOW_DIALOG' as const;
export const WIZARD_HIDE_DIALOG = 'WIZARD_HIDE_DIALOG' as const;
export const WIZARD_SET_COMMITTED = 'WIZARD_SET_COMMITTED' as const;
export const WIZARD_SET_COMMIT_ERROR = 'WIZARD_SET_COMMIT_ERROR' as const;
export const WIZARD_UNSET_COMMIT_ERROR = 'WIZARD_UNSET_COMMIT_ERROR' as const;

export type WizardAction =
  | { type: typeof WIZARD_SET_INITIALIZED; payload: { values: Record<string, unknown> } }
  | { type: typeof WIZARD_UPDATE_VALUES; payload: { values: Record<string, unknown> } }
  | { type: typeof WIZARD_NEXT_PAGE }
  | { type: typeof WIZARD_PREVIOUS_PAGE }
  | { type: typeof WIZARD_FINISH }
  | { type: typeof WIZARD_RESET }
  | { type: typeof WIZARD_SHOW_DIALOG; payload: { name: string } }
  | { type: typeof WIZARD_HIDE_DIALOG; payload: { name: string } }
  | { type: typeof WIZARD_SET_COMMITTED; payload: { key: string; values: Record<string, unknown> } }
  | { type: typeof WIZARD_SET_COMMIT_ERROR; payload: { error: unknown } }
  | { type: typeof WIZARD_UNSET_COMMIT_ERROR };

export function setInitialized(values: Record<string, unknown>) {
  return {
    type: WIZARD_SET_INITIALIZED,
    payload: {
      values
    }
  };
}

export function updateValues(values: Record<string, unknown>) {
  return {
    type: WIZARD_UPDATE_VALUES,
    payload: {
      values
    }
  };
}

export function nextPage() {
  return {
    type: WIZARD_NEXT_PAGE,
  };
}

export function previousPage() {
  return {
    type: WIZARD_PREVIOUS_PAGE,
  };
}

export function finish() {
  return {
    type: WIZARD_FINISH,
  };
}

export function reset() {
  return {
    type: WIZARD_RESET,
  };
}

export function showDialog(name: string) {
  return {
    type: WIZARD_SHOW_DIALOG,
    payload: {
      name
    }
  };
}

export function hideDialog(name: string) {
  return {
    type: WIZARD_HIDE_DIALOG,
    payload: {
      name
    }
  };
}

export function setCommitted(key: string, values: Record<string, unknown>) {
  return {
    type: WIZARD_SET_COMMITTED,
    payload: {
      key,
      values,
    },
  };
}

export function setCommitError(error: unknown) {
  return {
    type: WIZARD_SET_COMMIT_ERROR,
    payload: {
      error,
    },
  };
}

export function unsetCommitError() {
  return {
    type: WIZARD_UNSET_COMMIT_ERROR,
  };
}
