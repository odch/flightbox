import expect from 'expect';
import reducer from './reducer';
import * as actions from './actions';
import { addAircraftSuccess } from '../../../settings/aircrafts';

const INITIAL_STATE = {
  newItem: {}
};

describe('modules', () => {
  describe('ui', () => {
    describe('settings', () => {
      describe('aircrafts', () => {
        it('should handle initial state', () => {
          expect(
            reducer(undefined, {})
          ).toEqual(INITIAL_STATE);
        });

        describe('CHANGE_NEW_ITEM', () => {
          it('should add the item value for the given type', () => {
            expect(
              reducer({
                newItem: {
                  type1: 'VALUE1'
                }
              }, actions.changeNewItem('type2', 'VALUE2'))
            ).toEqual({
              newItem: {
                type1: 'VALUE1',
                type2: 'VALUE2'
              }
            });
          });

          it('should change the value to upper case', () => {
            expect(
              reducer(undefined, actions.changeNewItem('myType', 'value'))
            ).toEqual({
              newItem: {
                myType: 'VALUE'
              }
            });
          });

          it('should remove invalid characters (A-Z and 0-9 allowed)', () => {
            expect(
              reducer(undefined, actions.changeNewItem('myType', 'VALUE-WITH_INVALID_CHARS%1'))
            ).toEqual({
              newItem: {
                myType: 'VALUEWITHINVALIDCHARS1'
              }
            });
          });
        });

        describe('ADD_AIRCRAFT_SUCCESS', () => {
          it('should reset the item value for the given type', () => {
            expect(
              reducer({
                newItem: {
                  type1: 'VALUE1',
                  type2: 'VALUE2'
                }
              }, addAircraftSuccess('type1', 'VALUE2'))
            ).toEqual({
              newItem: {
                type1: '',
                type2: 'VALUE2'
              }
            });
          });

          it('should set an empty string for the given type if not existing', () => {
            expect(
              reducer({
                newItem: {
                  type1: 'VALUE1'
                }
              }, addAircraftSuccess('type2', 'VALUE2'))
            ).toEqual({
              newItem: {
                type1: 'VALUE1',
                type2: ''
              }
            });
          });
        });
      });
    });
  });
});
