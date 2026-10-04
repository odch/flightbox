import {all, fork} from 'redux-saga/effects';
import * as actions from './actions';
import sagas from './sagas';
import {watchSettingWhileAdmin} from '../watchSettingWhileAdmin';

describe('modules', () => {
  describe('settings', () => {
    describe('kioskAccessToken', () => {
      describe('sagas', () => {
        it('should watch the setting while an admin is signed in', () => {
          const generator = sagas();
          expect(generator.next().value).toEqual(all([
            fork(watchSettingWhileAdmin, '/settings/kioskAccessToken', actions.kioskAccessTokenLoaded),
          ]));
        });
      });
    });
  });
});
