import ImmutableItemsArray from '../../util/ImmutableItemsArray';
import * as actions from './actions';
import * as reducer from './reducer';

describe('modules', () => {
  describe('movements', () => {
    describe('reducers', () => {
      describe('setMovements', () => {
        it('should set movements', () => {
          const state = {
            loading: true,
            data: new ImmutableItemsArray([{
              key: 'arr1',
              type: 'arrival',
              immatriculation: 'HBKOF',
              date: '2017-04-28',
              time: '15:00'
            }, {
              key: 'dep1',
              type: 'departure',
              immatriculation: 'HBKOF',
              date: '2017-04-28',
              time: '14:00'
            }])
          };

          const newMovements = new ImmutableItemsArray([{
            key: 'arr2',
            type: 'arrival',
            immatriculation: 'HBKFW',
            date: '2017-04-29',
            time: '15:00'
          }, {
            key: 'dep1',
            type: 'departure',
            immatriculation: 'HBKFW',
            date: '2017-04-29',
            time: '14:00'
          }, {
            key: 'arr1',
            type: 'arrival',
            immatriculation: 'HBKOF',
            date: '2017-04-28',
            time: '15:00'
          }, {
            key: 'dep1',
            type: 'departure',
            immatriculation: 'HBKOF',
            date: '2017-04-28',
            time: '14:00'
          }]);

          const action = actions.setMovements(newMovements);

          const newState = reducer.setMovements(state, action);

          expect(newState.loading).toEqual(false);
          expect(newState.data).toEqual(newMovements);
        });
      });
    });
  });
});
