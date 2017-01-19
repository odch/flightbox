export const INIT_IMPORT = 'INIT_IMPORT';
export const SELECT_IMPORT_FILE = 'SELECT_IMPORT_FILE';
export const START_IMPORT = 'START_IMPORT';
export const SET_IMPORT_IN_PROGRESS = 'SET_IMPORT_IN_PROGRESS';
export const IMPORT_SUCCESS = 'IMPORT_SUCCESS';
export const IMPORT_FAILURE = 'IMPORT_FAILURE';

export function initImport(name) {
  return {
    type: INIT_IMPORT,
    payload: {
      name,
    },
  };
}

export function selectImportFile(importName, file) {
  return {
    type: SELECT_IMPORT_FILE,
    payload: {
      importName,
      file,
    },
  };
}

export function startImport(importName) {
  return {
    type: START_IMPORT,
    payload: {
      importName,
    },
  };
}

export function setImportInProgress(importName, inProgress) {
  return {
    type: SET_IMPORT_IN_PROGRESS,
    payload: {
      importName,
      inProgress,
    },
  };
}

export function importSuccess(importName) {
  return {
    type: IMPORT_SUCCESS,
    payload: {
      importName,
    },
  };
}

export function importFailure(importName) {
  return {
    type: IMPORT_FAILURE,
    payload: {
      importName,
    },
  };
}
