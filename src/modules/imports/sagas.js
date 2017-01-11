import { takeEvery } from 'redux-saga';
import { fork, call, put, select } from 'redux-saga/effects';
import * as actions from './actions';
import aerodromeImport from '../../util/aerodrome-import';
import aircraftImport from '../../util/aircraft-import';
import userImport from '../../util/user-import';

export const selectImport = importName => state => state.imports[importName];

export function doImport(importName, csvString) {
  switch (importName) {
    case 'aerodromes':
      return aerodromeImport(csvString);
    case 'aircrafts':
      return aircraftImport(csvString);
    case 'users':
      return userImport(csvString);
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

  yield put(actions.setImportInProgress(importName, true));

  const state = yield select(selectImport(importName));
  const csvString = yield call(getString, state.file);

  yield call(doImport, importName, csvString);

  yield put(actions.importSuccess(importName));
}

export default function* sagas() {
  yield [
    fork(takeEvery, actions.START_IMPORT, importSaga),
  ]
}
