import reducer from './reducer';
import * as actions from './actions';

const INITIAL_STATE = {
  deleteConfirmation: null,
  selected: null,
  filterExpanded: false
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

        describe('SET_MOVEMENTS_FILTER_EXPANDED', () => {
          it('should set the expanded flag', () => {
            expect(
              reducer({
                filterExpanded: false
              }, actions.setMovementsFilterExpanded(true))
            ).toEqual({
              filterExpanded: true
            });
          });
        });

        describe('SHOW_DELETE_CONFIRMATION_DIALOG', () => {
          it('should set deleteConfirmation to the item', () => {
            const item = { key: 'dep1', type: 'departure' };
            expect(
              reducer({
                deleteConfirmation: null
              }, actions.showDeleteConfirmationDialog(item))
            ).toEqual({
              deleteConfirmation: item
            });
          });
        });

        describe('HIDE_DELETE_CONFIRMATION_DIALOG', () => {
          it('should set deleteConfirmation to null', () => {
            const item = { key: 'dep1', type: 'departure' };
            expect(
              reducer({
                deleteConfirmation: item
              }, actions.hideDeleteConfirmationDialog())
            ).toEqual({
              deleteConfirmation: null
            });
          });
        });
      });
    });
  });
});
