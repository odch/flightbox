import { combineReducers } from 'redux';
import { fork } from 'redux-saga/effects'
import movements from './movements';
import wizard, { sagas as wizardSagas } from './wizard';

const reducer = combineReducers({
  movements,
  wizard,
});

export function* sagas() {
  yield [
    fork(wizardSagas),
  ]
}

export default reducer;
