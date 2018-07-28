import reducer from './reducer';
import * as actions from './actions';

const INITIAL_STATE = {
  deleteConfirmation: null,
  selected: null,
};

describe('modules', () => {
  describe('ui', () => {
    describe('movements', () => {
      describe('reducer', () => {
        it('should handle initial state', () => {
          expect(
            reducer(undefined, {})
          ).toEqual(INITIAL_STATE);
        });

        describe('SELECT_MOVEMENT', () => {
          it('should select the movement if none selected before', () => {
            expect(
              reducer({
                selected: null
              }, actions.selectMovement('key1'))
            ).toEqual({
              selected: 'key1'
            });
          });

          it('should select the movement if different one selected before', () => {
            expect(
              reducer({
                selected: 'key1'
              }, actions.selectMovement('key2'))
            ).toEqual({
              selected: 'key2'
            });
          });

          it('should reset the selected movement', () => {
            expect(
              reducer({
                selected: 'key1'
              }, actions.selectMovement(null))
            ).toEqual({
              selected: null
            });
          });
        });
      });
    });
  });
});
