import reducer from './reducer';
import * as actions from './actions';

const INITIAL_STATE = {
  days: null,
  saving: false,
};

describe('modules', () => {
  describe('settings', () => {
    describe('messageRetentionDays', () => {
      describe('reducer', () => {
        it('should handle initial state', () => {
          expect(
            reducer(undefined, {} as any)
          ).toEqual(INITIAL_STATE);
        });

        describe('MESSAGE_RETENTION_DAYS_LOADED', () => {
          it('should set the days', () => {
            expect(
              reducer({
                days: null,
                saving: false,
              }, actions.messageRetentionDaysLoaded(90))
            ).toEqual({
              days: 90,
              saving: false,
            });
          });

          it('should handle null days', () => {
            expect(
              reducer({
                days: 90,
                saving: false,
              }, actions.messageRetentionDaysLoaded(null))
            ).toEqual({
              days: null,
              saving: false,
            });
          });
        });

        describe('SET_MESSAGE_RETENTION_DAYS_SAVING', () => {
          it('should set saving to true', () => {
            expect(
              reducer({
                days: 90,
                saving: false,
              }, actions.setMessageRetentionDaysSaving())
            ).toEqual({
              days: 90,
              saving: true,
            });
          });
        });

        describe('SET_MESSAGE_RETENTION_DAYS_SUCCESS', () => {
          it('should set saving to false', () => {
            expect(
              reducer({
                days: 90,
                saving: true,
              }, actions.setMessageRetentionDaysSuccess())
            ).toEqual({
              days: 90,
              saving: false,
            });
          });
        });
      });
    });
  });
});
