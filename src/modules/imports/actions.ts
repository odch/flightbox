export const INIT_IMPORT = 'INIT_IMPORT' as const;
export const SELECT_IMPORT_FILE = 'SELECT_IMPORT_FILE' as const;
export const START_IMPORT = 'START_IMPORT' as const;
export const SET_IMPORT_IN_PROGRESS = 'SET_IMPORT_IN_PROGRESS' as const;
export const IMPORT_SUCCESS = 'IMPORT_SUCCESS' as const;
export const IMPORT_FAILURE = 'IMPORT_FAILURE' as const;

export type ImportsAction =
  | { type: typeof INIT_IMPORT; payload: { name: string } }
  | { type: typeof SELECT_IMPORT_FILE; payload: { importName: string; file: File } }
  | { type: typeof START_IMPORT; payload: { importName: string } }
  | { type: typeof SET_IMPORT_IN_PROGRESS; payload: { importName: string; inProgress: boolean } }
  | { type: typeof IMPORT_SUCCESS; payload: { importName: string } }
  | { type: typeof IMPORT_FAILURE; payload: { importName: string } };

export function initImport(name: string) {
  return {
    type: INIT_IMPORT,
    payload: {
      name,
    },
  };
}

export function selectImportFile(importName: string, file: File) {
  return {
    type: SELECT_IMPORT_FILE,
    payload: {
      importName,
      file,
    },
  };
}

export function startImport(importName: string) {
  return {
    type: START_IMPORT,
    payload: {
      importName,
    },
  };
}

export function setImportInProgress(importName: string, inProgress: boolean) {
  return {
    type: SET_IMPORT_IN_PROGRESS,
    payload: {
      importName,
      inProgress,
    },
  };
}

export function importSuccess(importName: string) {
  return {
    type: IMPORT_SUCCESS,
    payload: {
      importName,
    },
  };
}

export function importFailure(importName: string) {
  return {
    type: IMPORT_FAILURE,
    payload: {
      importName,
    },
  };
}
