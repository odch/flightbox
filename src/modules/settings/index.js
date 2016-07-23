import { combineReducers } from 'redux';
import { fork } from 'redux-saga/effects'

import lockDate, { sagas as lockDateSagas } from './lockDate';

const reducer = combineReducers({
  lockDate,
});

export function* sagas() {
  yield [
    fork(lockDateSagas),
  ]
}

export default reducer;
