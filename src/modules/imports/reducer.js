import * as actions from './actions';
import reducer from '../../util/reducer';

const INITIAL_STATE = {};

function initImport(state, action) {
  return Object.assign({}, state, {
    [action.payload.name]: {
      file: null,
      inProgress: false,
      done: false,
      failed: false,
    },
  });
}

function setImportFile(state, action) {
  const { importName, file } = action.payload;

  const newImportObj = Object.assign({}, state[importName], {
    file,
  });
  return Object.assign({}, state, {
    [importName]: newImportObj,
  });
}

function setImportInProgress(state, action) {
  const { importName, inProgress } = action.payload;

  const newImportObj = Object.assign({}, state[importName], {
    inProgress,
  });
  return Object.assign({}, state, {
    [importName]: newImportObj,
  });
}

function importSuccess(state, action) {
  const { importName } = action.payload;
  const newImportObj = Object.assign({}, state[importName], {
    inProgress: false,
    done: true,
  });
  return Object.assign({}, state, {
    [importName]: newImportObj,
  });
}

function importFailure(state, action) {
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

export default reducer(INITIAL_STATE, ACTION_HANDLERS);
