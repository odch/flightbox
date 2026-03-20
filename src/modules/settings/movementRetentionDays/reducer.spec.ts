import reducer from './reducer';
import * as actions from './actions';

const INITIAL_STATE = {
  days: null,
  saving: false,
};

describe('modules', () => {
  describe('settings', () => {
    describe('movementRetentionDays', () => {
      describe('reducer', () => {
        it('should handle initial state', () => {
          expect(
            reducer(undefined, {} as any)
          ).toEqual(INITIAL_STATE);
        });

        describe('MOVEMENT_RETENTION_DAYS_LOADED', () => {
          it('should set the days', () => {
            expect(
              reducer({
                days: null,
                saving: false,
              }, actions.movementRetentionDaysLoaded(365))
            ).toEqual({
              days: 365,
              saving: false,
            });
          });

          it('should handle null days', () => {
            expect(
              reducer({
                days: 365,
                saving: false,
              }, actions.movementRetentionDaysLoaded(null))
            ).toEqual({
              days: null,
              saving: false,
            });
          });
        });

        describe('SET_MOVEMENT_RETENTION_DAYS_SAVING', () => {
          it('should set saving to true', () => {
            expect(
              reducer({
                days: 365,
                saving: false,
              }, actions.setMovementRetentionDaysSaving())
            ).toEqual({
              days: 365,
              saving: true,
            });
          });
        });

        describe('SET_MOVEMENT_RETENTION_DAYS_SUCCESS', () => {
          it('should set saving to false', () => {
            expect(
              reducer({
                days: 365,
                saving: true,
              }, actions.setMovementRetentionDaysSuccess())
            ).toEqual({
              days: 365,
              saving: false,
            });
          });
        });
      });
    });
  });
});
