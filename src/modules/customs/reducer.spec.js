import reducer from './reducer';
import * as actions from './actions';

const INITIAL_STATE = {
  loading: undefined,
  success: undefined,
  available: undefined,
};

describe('modules', () => {
  describe('customs', () => {
    describe('reducer', () => {
      it('should handle initial state', () => {
        expect(
          reducer(undefined, {})
        ).toEqual(INITIAL_STATE);
      });

      describe('SET_START_CUSTOMS_LOADING', () => {
        it('should set loading flag', () => {
          expect(
            reducer({
              loading: undefined,
              success: undefined,
              available: undefined,
            }, actions.setStartCustomsLoading())
          ).toEqual({
            loading: true,
            success: undefined,
            available: undefined,
          });
        });
      });

      describe('START_CUSTOMS_SUCCESS', () => {
        it('should set success and clear loading', () => {
          expect(
            reducer({
              loading: true,
              success: undefined,
              available: true,
            }, actions.setStartCustomsSuccess())
          ).toEqual({
            loading: false,
            success: true,
            available: true,
          });
        });
      });

      describe('START_CUSTOMS_FAILURE', () => {
        it('should set success to false and clear loading', () => {
          expect(
            reducer({
              loading: true,
              success: undefined,
              available: true,
            }, actions.setStartCustomsFailure(new Error('customs failed')))
          ).toEqual({
            loading: false,
            success: false,
            available: true,
          });
        });
      });

      describe('SET_CUSTOMS_AVAILABILITY', () => {
        it('should set available to true', () => {
          expect(
            reducer({
              loading: undefined,
              success: undefined,
              available: undefined,
            }, actions.setCustomsAvailability(true))
          ).toEqual({
            loading: undefined,
            success: undefined,
            available: true,
          });
        });

        it('should set available to false', () => {
          expect(
            reducer({
              loading: undefined,
              success: undefined,
              available: true,
            }, actions.setCustomsAvailability(false))
          ).toEqual({
            loading: undefined,
            success: undefined,
            available: false,
          });
        });
      });
    });
  });
});
