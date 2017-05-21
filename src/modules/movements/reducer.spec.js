import expect from 'expect';
import ImmutableItemsArray from '../../util/ImmutableItemsArray';
import * as actions from './actions';
import * as reducer from './reducer';
import FakeFirebaseSnapshot from '../../../test/FakeFirebaseSnapshot'

describe('modules', () => {
  describe('movements', () => {
    describe('reducers', () => {
      describe('childrenAdded', () => {
        it('should add children', () => {
          const state = {
            refs: [{
              type: 'departure',
              ref: {
                name: 'ref1'
              }
            }],
            loading: true,
            data: new ImmutableItemsArray([{
              key: 'dep2',
              type: 'departure',
              immatriculation: 'HBKOF',
              date: '2017-04-28',
              time: '15:00'
            }, {
              key: 'dep1',
              type: 'departure',
              immatriculation: 'HBKFW',
              date: '2017-04-28',
              time: '14:00'
            }])
          };

          const snapshot = new FakeFirebaseSnapshot(null, [
            new FakeFirebaseSnapshot('arr1', {
              immatriculation: 'HBKOF',
              dateTime: '2017-04-28T14:00:00.000Z'
            }),
            new FakeFirebaseSnapshot('arr2', {
              immatriculation: 'HBKFW',
              dateTime: '2017-04-28T15:00:00.000Z'
            })
          ]);
          const action = actions.movementsAdded(snapshot, {name: 'ref2'}, 'arrival');

          const newState = reducer.childrenAdded(state, action);

          expect(newState.loading).toEqual(false);

          expect(newState.refs).toEqual([{
            type: 'departure',
            ref: {
              name: 'ref1'
            }
          }, {
            type: 'arrival',
            ref: {
              name: 'ref2'
            }
          }]);

          // `key` must have been added
          // `type: 'departure'` must have been added
          // `dateTime` must have been converted to `date` and `time` in local time
          // items must have been inserted in the right order
          // associations must have been added
          expect(newState.data.array).toEqual([{
            key: 'arr2',
            date: '2017-04-28',
            immatriculation: 'HBKFW',
            time: '17:00',
            type: 'arrival',
            associations: {
              preceding: 'dep1',
              subsequent: null
            }
          }, {
            key: 'arr1',
            date: '2017-04-28',
            immatriculation: 'HBKOF',
            time: '16:00',
            type: 'arrival',
            associations: {
              preceding: 'dep2',
              subsequent: null
            }
          }, {
            key: 'dep2',
            date: '2017-04-28',
            immatriculation: 'HBKOF',
            time: '15:00',
            type: 'departure',
            associations: {
              preceding: null,
              subsequent: 'arr1'
            }
          }, {
            key: 'dep1',
            time: '14:00',
            date: '2017-04-28',
            immatriculation: 'HBKFW',
            type: 'departure',
            associations: {
              preceding: null,
              subsequent: 'arr2'
            }
          }]);
        });
      });

      describe('childAdded', () => {
        it('should add child', () => {
          const state = {
            data: new ImmutableItemsArray([{
              key: 'dep2',
              type: 'departure',
              immatriculation: 'HBKOF',
              date: '2017-04-28',
              time: '15:00'
            }, {
              key: 'dep1',
              type: 'departure',
              immatriculation: 'HBKFW',
              date: '2017-04-28',
              time: '14:00'
            }])
          };

          const snapshot = new FakeFirebaseSnapshot('arr1', {
            immatriculation: 'HBKFW',
            dateTime: '2017-04-28T12:30:00.000Z'
          });
          const action = actions.movementAdded(snapshot, 'arrival');

          const newState = reducer.childAdded(state, action);

          // `key` must have been added
          // `type: 'departure'` must have been added
          // `dateTime` must have been converted to `date` and `time` in local time
          // item must have been inserted in the right order
          // associations must have been added
          expect(newState.data.array).toEqual([{
            key: 'dep2',
            date: '2017-04-28',
            immatriculation: 'HBKOF',
            time: '15:00',
            type: 'departure',
            associations: {
              preceding: null,
              subsequent: null
            }
          }, {
            key: 'arr1',
            date: '2017-04-28',
            immatriculation: 'HBKFW',
            time: '14:30',
            type: 'arrival',
            associations: {
              preceding: 'dep1',
              subsequent: null
            }
          }, {
            key: 'dep1',
            time: '14:00',
            date: '2017-04-28',
            immatriculation: 'HBKFW',
            type: 'departure',
            associations: {
              preceding: null,
              subsequent: 'arr1'
            }
          }]);
        });
      });

      describe('childChanged', () => {
        it('should change child', () => {
          const state = {
            data: new ImmutableItemsArray([{
              key: 'arr1',
              type: 'arrival',
              immatriculation: 'HBKFW',
              date: '2017-04-28',
              time: '15:00'
            }, {
              key: 'dep1',
              type: 'departure',
              immatriculation: 'HBKFW',
              date: '2017-04-28',
              time: '14:00'
            }])
          };

          const snapshot = new FakeFirebaseSnapshot('dep1', {
            immatriculation: 'HBKFW',
            dateTime: '2017-04-28T13:30:00.000Z'
          });
          const action = actions.movementChanged(snapshot, 'departure');

          const newState = reducer.childChanged(state, action);

          // item must have been updated
          // item must have put to the right place (ordered chronologically)
          // associations must have been added
          expect(newState.data.array).toEqual([{
            key: 'dep1',
            time: '15:30',
            date: '2017-04-28',
            immatriculation: 'HBKFW',
            type: 'departure',
            associations: {
              preceding: 'arr1',
              subsequent: null
            }
          }, {
            key: 'arr1',
            date: '2017-04-28',
            immatriculation: 'HBKFW',
            time: '15:00',
            type: 'arrival',
            associations: {
              preceding: null,
              subsequent: 'dep1'
            }
          }]);
        });
      });

      describe('childRemoved', () => {
        it('should remove child', () => {
          const state = {
            data: new ImmutableItemsArray([{
              key: 'dep2',
              type: 'departure',
              immatriculation: 'HBKOF',
              date: '2017-04-28',
              time: '15:00'
            }, {
              key: 'dep1',
              type: 'departure',
              immatriculation: 'HBKFW',
              date: '2017-04-28',
              time: '14:00'
            }])
          };

          const snapshot = new FakeFirebaseSnapshot('dep1');
          const action = actions.movementDeleted(snapshot, 'departure');

          const newState = reducer.childRemoved(state, action);

          expect(newState.data.array).toEqual([{
            key: 'dep2',
            date: '2017-04-28',
            immatriculation: 'HBKOF',
            time: '15:00',
            type: 'departure',
            associations: {
              preceding: null,
              subsequent: null
            }
          }]);
        });
      });
    });
  });
});
