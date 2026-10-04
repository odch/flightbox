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
    describe('movementRetentionDays', () => {
      describe('sagas', () => {
        beforeEach(() => {
          jest.clearAllMocks();
          (firebase as jest.Mock).mockReturnValue({});
        });

        describe('default', () => {
          it('should watch the setting while an admin is signed in and handle saves', () => {
            const generator = sagas.default();
            expect(generator.next().value).toEqual(all([
              fork(watchSettingWhileAdmin, '/settings/movementRetentionDays', actions.movementRetentionDaysLoaded),
              takeEvery(actions.SET_MOVEMENT_RETENTION_DAYS, sagas.setMovementRetentionDays),
            ]));
          });
        });

        describe('setMovementRetentionDays', () => {
          it('should dispatch saving, save the days, and dispatch success', () => {
            const days = 365;
            const action = actions.setMovementRetentionDays(days);
            const generator = sagas.setMovementRetentionDays(action);

            expect(generator.next().value).toEqual(put(actions.setMovementRetentionDaysSaving()));
            expect(generator.next().value).toEqual(call(sagas.saveMovementRetentionDays, days));
            expect(generator.next().value).toEqual(put(actions.setMovementRetentionDaysSuccess()));
            expect(generator.next().done).toEqual(true);
          });
        });

        describe('saveMovementRetentionDays', () => {
          it('calls set with the days value', async () => {
            const mockRef = {};
            (firebase as jest.Mock).mockReturnValue(mockRef);
            (set as jest.Mock).mockResolvedValue(undefined);

            await sagas.saveMovementRetentionDays(365);

            expect(firebase).toHaveBeenCalledWith('/settings/movementRetentionDays');
            expect(set).toHaveBeenCalledWith(mockRef, 365);
          });

          it('calls set with null', async () => {
            const mockRef = {};
            (firebase as jest.Mock).mockReturnValue(mockRef);
            (set as jest.Mock).mockResolvedValue(undefined);

            await sagas.saveMovementRetentionDays(null);

            expect(set).toHaveBeenCalledWith(mockRef, null);
          });
        });
      });
    });
  });
});
