export const WIZARD_SET_INITIALIZED = 'WIZARD_SET_INITIALIZED';
export const WIZARD_UPDATE_VALUES = 'WIZARD_UPDATE_VALUES';
export const WIZARD_NEXT_PAGE = 'WIZARD_NEXT_PAGE';
export const WIZARD_PREVIOUS_PAGE = 'WIZARD_PREVIOUS_PAGE';
export const WIZARD_FINISH = 'WIZARD_FINISH';
export const WIZARD_RESET = 'WIZARD_RESET';
export const WIZARD_SHOW_DIALOG = 'WIZARD_SHOW_DIALOG';
export const WIZARD_HIDE_DIALOG = 'WIZARD_HIDE_DIALOG';
export const WIZARD_SET_COMMITTED = 'WIZARD_SET_COMMITTED';
export const WIZARD_SET_COMMIT_ERROR = 'WIZARD_SET_COMMIT_ERROR';
export const WIZARD_UNSET_COMMIT_ERROR = 'WIZARD_UNSET_COMMIT_ERROR';

export function setInitialized(values) {
  return {
    type: WIZARD_SET_INITIALIZED,
    payload: {
      values
    }
  };
}

export function updateValues(values) {
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

export function showDialog(name) {
  return {
    type: WIZARD_SHOW_DIALOG,
    payload: {
      name
    }
  };
}

export function hideDialog(name) {
  return {
    type: WIZARD_HIDE_DIALOG,
    payload: {
      name
    }
  };
}

export function setCommitted(key, values) {
  return {
    type: WIZARD_SET_COMMITTED,
    payload: {
      key,
      values,
    },
  };
}

export function setCommitError(error) {
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
