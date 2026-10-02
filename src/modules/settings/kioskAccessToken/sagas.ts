import {all, fork} from 'redux-saga/effects';
import * as actions from './actions';
import {watchSettingWhileAdmin} from '../watchSettingWhileAdmin';

export default function* sagas() {
  yield all([
    fork(watchSettingWhileAdmin, '/settings/kioskAccessToken', actions.kioskAccessTokenLoaded),
  ])
}
