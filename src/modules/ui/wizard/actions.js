export const WIZARD_NEXT_PAGE = 'WIZARD_NEXT_PAGE';
export const WIZARD_PREVIOUS_PAGE = 'WIZARD_PREVIOUS_PAGE';
export const WIZARD_FINISH = 'WIZARD_FINISH';
export const WIZARD_RESET = 'WIZARD_RESET';
export const WIZARD_SHOW_COMMIT_REQUIREMENTS_DIALOG = 'WIZARD_SHOW_COMMIT_REQUIREMENTS_DIALOG';
export const WIZARD_HIDE_COMMIT_REQUIREMENTS_DIALOG = 'WIZARD_HIDE_COMMIT_REQUIREMENTS_DIALOG';
export const WIZARD_SET_COMMITTED = 'WIZARD_SET_COMMITTED';

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

export function showCommitRequirementsDialog() {
  return {
    type: WIZARD_SHOW_COMMIT_REQUIREMENTS_DIALOG,
  };
}

export function hideCommitRequirementsDialog() {
  return {
    type: WIZARD_HIDE_COMMIT_REQUIREMENTS_DIALOG,
  };
}

export function setCommitted(key, values) {
  return {
    type: WIZARD_SET_COMMITTED,
    payload: {
      key,
      values,
    }
  };
}
