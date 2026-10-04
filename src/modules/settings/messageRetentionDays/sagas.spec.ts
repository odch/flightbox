import {all, call, fork, put, takeEvery} from 'redux-saga/effects';
import * as actions from './actions';
import * as sagas from './sagas';
import {watchSettingWhileAdmin} from '../watchSettingWhileAdmin';
import firebase from '../../../util/firebase';
import {set} from 'firebase/database';

jest.mock('../../../util/firebase');
jest.mock('firebase/database', () => ({
  set: jest.fn(),
}));

describe('modules', () => {
  describe('settings', () => {
    describe('messageRetentionDays', () => {
      describe('sagas', () => {
        beforeEach(() => {
          jest.clearAllMocks();
          (firebase as jest.Mock).mockReturnValue({});
        });

        describe('default', () => {
          it('should watch the setting while an admin is signed in and handle saves', () => {
            const generator = sagas.default();
            expect(generator.next().value).toEqual(all([
              fork(watchSettingWhileAdmin, '/settings/messageRetentionDays', actions.messageRetentionDaysLoaded),
              takeEvery(actions.SET_MESSAGE_RETENTION_DAYS, sagas.setMessageRetentionDays),
            ]));
          });
        });

        describe('setMessageRetentionDays', () => {
          it('should dispatch saving, save the days, and dispatch success', () => {
            const days = 90;
            const action = actions.setMessageRetentionDays(days);
            const generator = sagas.setMessageRetentionDays(action);

            expect(generator.next().value).toEqual(put(actions.setMessageRetentionDaysSaving()));
            expect(generator.next().value).toEqual(call(sagas.saveMessageRetentionDays, days));
            expect(generator.next().value).toEqual(put(actions.setMessageRetentionDaysSuccess()));
            expect(generator.next().done).toEqual(true);
          });
        });

        describe('saveMessageRetentionDays', () => {
          it('calls set with the days value', async () => {
            const mockRef = {};
            (firebase as jest.Mock).mockReturnValue(mockRef);
            (set as jest.Mock).mockResolvedValue(undefined);

            await sagas.saveMessageRetentionDays(90);

            expect(firebase).toHaveBeenCalledWith('/settings/messageRetentionDays');
            expect(set).toHaveBeenCalledWith(mockRef, 90);
          });

          it('calls set with null', async () => {
            const mockRef = {};
            (firebase as jest.Mock).mockReturnValue(mockRef);
            (set as jest.Mock).mockResolvedValue(undefined);

            await sagas.saveMessageRetentionDays(null);

            expect(set).toHaveBeenCalledWith(mockRef, null);
          });
        });
      });
    });
  });
});
