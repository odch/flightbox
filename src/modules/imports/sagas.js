import {takeEvery} from 'redux-saga';
import {call, fork, put, select} from 'redux-saga/effects';
import * as actions from './actions';
import importAircrafts from '../../util/importAircrafts';
import importUsers from '../../util/importUsers';
import {error} from '../../util/log';

export const selectImport = importName => state => state.imports[importName];

export function doImport(importName, csvString) {
  switch (importName) {
    case 'aircrafts':
      return importAircrafts(csvString);
    case 'users':
      return importUsers(csvString);
    default:
      throw new Error('Unknown import ' + importName);
  }
}

export function getString(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = event => resolve(event.target.result);
    reader.onerror = error => reject(error);
    reader.readAsText(file);
  });
}

export function* importSaga(action) {
  const importName = action.payload.importName;
  try {
    yield put(actions.setImportInProgress(importName, true));

    const state = yield select(selectImport(importName));
    const csvString = yield call(getString, state.file);

    yield call(doImport, importName, csvString);

    yield put(actions.importSuccess(importName));
  } catch(e) {
    error('Failed to import data (import: ' + importName + ')', e);
    yield put(actions.importFailure(importName));
  }
}

export default function* sagas() {
  yield [
    fork(takeEvery, actions.START_IMPORT, importSaga),
  ]
}
