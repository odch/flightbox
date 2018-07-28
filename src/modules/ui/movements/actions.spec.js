import * as actions from './actions';

describe('modules', () => {
  describe('ui', () => {
    describe('movements', () => {
      describe('actions', () => {
        describe('selectMovement', () => {
          it('should create the action with a key', () => {
            expect(
              actions.selectMovement('key1')
            ).toEqual({
              type: actions.SELECT_MOVEMENT,
              payload: {
                key: 'key1',
              }
            });
          });

          it('should create the action without a key', () => {
            expect(
              actions.selectMovement(null)
            ).toEqual({
              type: actions.SELECT_MOVEMENT,
              payload: {
                key: null,
              }
            });
          });
        });
      });
    });
  });
});
