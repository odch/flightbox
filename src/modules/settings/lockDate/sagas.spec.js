import {call, put, take} from 'redux-saga/effects';
import * as actions from './actions';
import * as sagas from './sagas';
import firebase from '../../../util/firebase';
import {onValue, set} from 'firebase/database';

jest.mock('../../../util/firebase');
jest.mock('firebase/database', () => ({
  onValue: jest.fn(),
  set: jest.fn(),
}));

describe('modules', () => {
  describe('settings', () => {
    describe('lockDate', () => {
      describe('sagas', () => {
        beforeEach(() => {
          jest.clearAllMocks();
          firebase.mockReturnValue({});
        });

        describe('watchLoadLockDate', () => {
          it('should wait for load action, dispatch loading, and register onValue listener', () => {
            const channel = {put: jest.fn()};
            const generator = sagas.watchLoadLockDate(channel);

            expect(generator.next().value).toEqual(take(actions.LOAD_LOCK_DATE));
            expect(generator.next().value).toEqual(put(actions.lockDateLoading()));
            expect(generator.next().done).toEqual(true);
            expect(onValue).toHaveBeenCalledWith(expect.anything(), expect.any(Function));
          });
        });

        describe('setLockDate', () => {
          it('should dispatch saving, save the date, and dispatch success', () => {
            const lockDate = '2024-06-01';
            const action = actions.setLockDate(lockDate);
            const generator = sagas.setLockDate(action);

            expect(generator.next().value).toEqual(put(actions.setLockDateSaving()));
            expect(generator.next().value).toEqual(call(sagas.saveLockDate, lockDate));
            expect(generator.next().value).toEqual(put(actions.setLockDateSuccess()));
            expect(generator.next().done).toEqual(true);
          });
        });

        describe('saveLockDate', () => {
          it('calls set and resolves', async () => {
            const mockRef = {};
            firebase.mockReturnValue(mockRef);
            set.mockResolvedValue();

            await sagas.saveLockDate('2024-06-01');

            expect(firebase).toHaveBeenCalledWith('/settings/lockDate');
            expect(set).toHaveBeenCalledWith(mockRef, '2024-06-01');
          });

          it('calls set with null and resolves', async () => {
            const mockRef = {};
            firebase.mockReturnValue(mockRef);
            set.mockResolvedValue();

            await sagas.saveLockDate(null);

            expect(set).toHaveBeenCalledWith(mockRef, null);
          });
        });
      });
    });
  });
});
