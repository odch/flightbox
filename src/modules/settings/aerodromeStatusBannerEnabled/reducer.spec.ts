import reducer from './reducer';
import * as actions from './actions';

const INITIAL_STATE = {
  enabled: false,
  saving: false,
};

describe('modules', () => {
  describe('settings', () => {
    describe('aerodromeStatusBannerEnabled', () => {
      describe('reducer', () => {
        it('should handle initial state', () => {
          expect(
            reducer(undefined, {} as any)
          ).toEqual(INITIAL_STATE);
        });

        describe('AERODROME_STATUS_BANNER_ENABLED_LOADED', () => {
          it('should set enabled to true', () => {
            expect(
              reducer({
                enabled: false,
                saving: false,
              }, actions.aerodromeStatusBannerEnabledLoaded(true))
            ).toEqual({
              enabled: true,
              saving: false,
            });
          });

          it('should set enabled to false', () => {
            expect(
              reducer({
                enabled: true,
                saving: false,
              }, actions.aerodromeStatusBannerEnabledLoaded(false))
            ).toEqual({
              enabled: false,
              saving: false,
            });
          });
        });

        describe('SET_AERODROME_STATUS_BANNER_ENABLED_SAVING', () => {
          it('should set saving to true', () => {
            expect(
              reducer({
                enabled: true,
                saving: false,
              }, actions.setAerodromeStatusBannerEnabledSaving())
            ).toEqual({
              enabled: true,
              saving: true,
            });
          });
        });

        describe('SET_AERODROME_STATUS_BANNER_ENABLED_SUCCESS', () => {
          it('should set saving to false', () => {
            expect(
              reducer({
                enabled: true,
                saving: true,
              }, actions.setAerodromeStatusBannerEnabledSuccess())
            ).toEqual({
              enabled: true,
              saving: false,
            });
          });
        });
      });
    });
  });
});
