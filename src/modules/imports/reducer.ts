import * as actions from './actions';
import { ImportsAction } from './actions';
import reducer from '../../util/reducer';

interface ImportItem {
  file: File | null;
  inProgress: boolean;
  done: boolean;
  failed: boolean;
}

interface ImportsState {
  [importName: string]: ImportItem;
}

const INITIAL_STATE: ImportsState = {};

function initImport(state: ImportsState, action: ImportsAction & { type: typeof actions.INIT_IMPORT }) {
  return Object.assign({}, state, {
    [action.payload.name]: {
      file: null,
      inProgress: false,
      done: false,
      failed: false,
    },
  });
}

function setImportFile(state: ImportsState, action: ImportsAction & { type: typeof actions.SELECT_IMPORT_FILE }) {
  const { importName, file } = action.payload;

  const newImportObj = Object.assign({}, state[importName], {
    file,
  });
  return Object.assign({}, state, {
    [importName]: newImportObj,
  });
}

function setImportInProgress(state: ImportsState, action: ImportsAction & { type: typeof actions.SET_IMPORT_IN_PROGRESS }) {
  const { importName, inProgress } = action.payload;

  const newImportObj = Object.assign({}, state[importName], {
    inProgress,
  });
  return Object.assign({}, state, {
    [importName]: newImportObj,
  });
}

function importSuccess(state: ImportsState, action: ImportsAction & { type: typeof actions.IMPORT_SUCCESS }) {
  const { importName } = action.payload;
  const newImportObj = Object.assign({}, state[importName], {
    inProgress: false,
    done: true,
  });
  return Object.assign({}, state, {
    [importName]: newImportObj,
  });
}

function importFailure(state: ImportsState, action: ImportsAction & { type: typeof actions.IMPORT_FAILURE }) {
  const { importName } = action.payload;
  const newImportObj = Object.assign({}, state[importName], {
    inProgress: false,
    failed: true,
  });
  return Object.assign({}, state, {
    [importName]: newImportObj,
  });
}

const ACTION_HANDLERS = {
  [actions.INIT_IMPORT]: initImport,
  [actions.SELECT_IMPORT_FILE]: setImportFile,
  [actions.SET_IMPORT_IN_PROGRESS]: setImportInProgress,
  [actions.IMPORT_SUCCESS]: importSuccess,
  [actions.IMPORT_FAILURE]: importFailure,
};

export type { ImportsState };
export default reducer<ImportsState, ImportsAction>(INITIAL_STATE, ACTION_HANDLERS);
