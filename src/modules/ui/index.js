import { combineReducers } from 'redux';
import { fork } from 'redux-saga/effects'

import movements from './movements';

const reducer = combineReducers({
  movements,
});

export function* sagas() {
  yield [
  ]
}

export default reducer;
