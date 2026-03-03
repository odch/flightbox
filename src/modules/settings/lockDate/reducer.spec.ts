import reducer from './reducer';
import * as actions from './actions';

const INITIAL_STATE = {
  date: null,
  loading: false,
  saving: false,
};

describe('modules', () => {
  describe('settings', () => {
    describe('lockDate', () => {
      describe('reducer', () => {
        it('should handle initial state', () => {
          expect(
            reducer(undefined, {} as any)
          ).toEqual(INITIAL_STATE);
        });

        describe('LOCK_DATE_LOADING', () => {
          it('should set loading to true', () => {
            expect(
              reducer({
                date: null,
                loading: false,
                saving: false,
              }, actions.lockDateLoading())
            ).toEqual({
              date: null,
              loading: true,
              saving: false,
            });
          });
        });

        describe('LOCK_DATE_LOADED', () => {
          it('should set loading to false and store the lock date', () => {
            const lockDate = '2026-01-01';
            expect(
              reducer({
                date: null,
                loading: true,
                saving: false,
              }, actions.lockDateLoaded(lockDate))
            ).toEqual({
              date: lockDate,
              loading: false,
              saving: false,
            });
          });

          it('should handle null lock date', () => {
            expect(
              reducer({
                date: '2026-01-01',
                loading: true,
                saving: false,
              }, actions.lockDateLoaded(null))
            ).toEqual({
              date: null,
              loading: false,
              saving: false,
            });
          });
        });

        describe('SET_LOCK_DATE_SAVING', () => {
          it('should set saving to true', () => {
            expect(
              reducer({
                date: '2026-01-01',
                loading: false,
                saving: false,
              }, actions.setLockDateSaving())
            ).toEqual({
              date: '2026-01-01',
              loading: false,
              saving: true,
            });
          });
        });

        describe('SET_LOCK_DATE_SUCCESS', () => {
          it('should set saving to false', () => {
            expect(
              reducer({
                date: '2026-01-01',
                loading: false,
                saving: true,
              }, actions.setLockDateSuccess())
            ).toEqual({
              date: '2026-01-01',
              loading: false,
              saving: false,
            });
          });
        });
      });
    });
  });
});
