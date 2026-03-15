import {all, call, put, select, takeEvery} from 'redux-saga/effects';
import * as actions from './actions';
import importUsers from '../../util/importUsers';
import {error} from '../../util/log';

export const selectImport = (importName: string) => (state: any) => state.imports[importName];

export function doImport(importName: string, csvString: string) {
  switch (importName) {
    case 'users':
      return importUsers(csvString);
    default:
      throw new Error('Unknown import ' + importName);
  }
}

export function getString(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = event => resolve((event.target as FileReader).result as string);
    reader.onerror = err => reject(err);
    reader.readAsText(file);
  });
}

export function* importSaga(action: any) {
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
  yield all([
    takeEvery(actions.START_IMPORT, importSaga),
  ])
}
