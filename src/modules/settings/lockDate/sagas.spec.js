import {call, put, take} from 'redux-saga/effects';
import * as actions from './actions';
import * as sagas from './sagas';
import firebase from '../../../util/firebase';

jest.mock('../../../util/firebase');

describe('modules', () => {
  describe('settings', () => {
    describe('lockDate', () => {
      describe('sagas', () => {
        describe('watchLoadLockDate', () => {
          it('should wait for load action, dispatch loading, and register firebase listener', () => {
            const channel = {put: jest.fn()};
            const mockRef = {on: jest.fn()};
            firebase.mockReturnValue(mockRef);
            const generator = sagas.watchLoadLockDate(channel);

            expect(generator.next().value).toEqual(take(actions.LOAD_LOCK_DATE));
            expect(generator.next().value).toEqual(put(actions.lockDateLoading()));
            expect(generator.next().done).toEqual(true);
            expect(mockRef.on).toHaveBeenCalledWith('value', expect.any(Function));
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
          it('calls firebase set and resolves the promise', async () => {
            const mockRef = { set: jest.fn((date, cb) => cb()) };
            firebase.mockReturnValue(mockRef);

            await sagas.saveLockDate('2024-06-01');

            expect(firebase).toHaveBeenCalledWith('/settings/lockDate');
            expect(mockRef.set).toHaveBeenCalledWith('2024-06-01', expect.any(Function));
          });

          it('calls firebase set with null and resolves', async () => {
            const mockRef = { set: jest.fn((date, cb) => cb()) };
            firebase.mockReturnValue(mockRef);

            await sagas.saveLockDate(null);

            expect(mockRef.set).toHaveBeenCalledWith(null, expect.any(Function));
          });
        });
      });
    });
  });
});
