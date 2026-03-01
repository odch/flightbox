import {call, put, take} from 'redux-saga/effects';
import * as actions from './actions';
import * as sagas from './sagas';

jest.mock('../../../util/firebase');

describe('modules', () => {
  describe('settings', () => {
    describe('lockDate', () => {
      describe('sagas', () => {
        describe('watchLoadLockDate', () => {
          it('should wait for load action, dispatch loading, and register firebase listener', () => {
            const channel = {put: jest.fn()};
            const generator = sagas.watchLoadLockDate(channel);

            expect(generator.next().value).toEqual(take(actions.LOAD_LOCK_DATE));
            expect(generator.next().value).toEqual(put(actions.lockDateLoading()));
            expect(generator.next().done).toEqual(true);
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
          it('should be a function', () => {
            expect(typeof sagas.saveLockDate).toEqual('function');
          });
        });
      });
    });
  });
});
