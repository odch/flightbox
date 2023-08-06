import ImmutableItemsArray from '../../util/ImmutableItemsArray';
import * as actions from './actions';
import reducer from './reducer';

const INITIAL_STATE = {
  data: new ImmutableItemsArray(),
  loading: false,
  loadingFailed: false,
  byKey: {},
  filter: {
    date: { // "end" is the newer date bound ("start" must come before "end")
      start: null,
      end: null
    },
    immatriculation: '',
    onlyWithoutAssociatedMovement: false
  }
};

describe('modules', () => {
  describe('movements', () => {
    describe('reducers', () => {
      it('should handle initial state', () => {
        expect(
          reducer(undefined, {})
        ).toEqual(INITIAL_STATE);
      });

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

          const newState = reducer(state, action);

          expect(newState.loading).toEqual(false);
          expect(newState.data).toEqual(newMovements);
        });
      });
    });
  });
});
