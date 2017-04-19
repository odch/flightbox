import expect from 'expect';
import { select, put, call } from 'redux-saga/effects';
import { initialize, getFormValues, destroy } from 'redux-form';
import dates from '../../../util/dates';
import ImmutableItemsArray from '../../../util/ImmutableItemsArray';
import * as actions from './actions';
import * as sagas from './sagas';
import * as remote from './remote';
import {LIMIT} from './pagination';
import Utils from '../../../../test/Utils';

describe('modules', () => {
  describe('movements', () => {
    describe('shared', () => {
      describe('sagas', () => {
        describe('initNewMovement', () => {
          it('should init new departure', () => {
            const loadInitialValues = () => undefined;

            const generator = sagas.initNewMovement(loadInitialValues, 'testarg1', 'testarg2');

            expect(generator.next().value).toEqual(put(actions.startInitializeWizard()));
            expect(generator.next().value).toEqual(put(destroy('wizard')));
            expect(generator.next().value).toEqual(call(loadInitialValues, 'testarg1', 'testarg2'));

            const initialValues = {
              date: dates.localDate(),
              time: dates.localTimeRounded(15, 'up'),
            };

            expect(generator.next(initialValues).value).toEqual(put(initialize('wizard', initialValues)));

            expect(generator.next().value).toEqual(put(actions.wizardInitialized()));

            expect(generator.next().done).toEqual(true);
          });
        });

        describe('saveMovement', () => {
          it('should save departure', () => {
            const successAction = () => ({
              type: 'TEST_SUCCESS_ACTION',
            });

            const generator = sagas.saveMovement('/departures', successAction);

            expect(generator.next().value).toEqual(select(getFormValues('wizard')));

            const formValues = {
              immatriculation: 'HBABC',
              date: '2016-10-09',
              time: '16:00',
            };

            const formValuesForFirebase = {
              immatriculation: 'HBABC',
              dateTime: '2016-10-09T14:00:00.000Z',
              negativeTimestamp: -1476021600000,
            };

            expect(generator.next(formValues).value).toEqual(call(remote.saveMovement, '/departures', undefined, formValuesForFirebase));

            const key = 'new-departure-key';

            expect(generator.next(key).value).toEqual(put(successAction()));

            expect(generator.next().done).toEqual(true);
          });
        });
      });

      describe('loadMovements', () => {
        it('should load new movements range', () => {
          const setLoadingAction = () => ({type: 'LOADING'});
          const failureAction = () => ({type: 'FAILURE'});
          const stateSelector = () => {};
          const firebasePath = '/movements';
          const channel = {
            put: Utils.callTracker()
          };
          const successAction = (snapshot, ref) => ({type: 'SUCCESS', payload: {snapshot, ref}});
          const childAddedAction = () => {};
          const childChangedAction = () => {};
          const childRemovedAction = () => {};

          const generator = sagas.loadMovements(
            setLoadingAction,
            failureAction,
            stateSelector,
            firebasePath,
            channel,
            successAction,
            childAddedAction,
            childChangedAction,
            childRemovedAction
          );

          expect(generator.next().value).toEqual(select(stateSelector));

          const state = {
            loading: false,
            data: new ImmutableItemsArray()
          };

          expect(generator.next(state).value).toEqual(put(setLoadingAction()));

          expect(generator.next().value).toEqual(call(remote.loadLimited, firebasePath, undefined, LIMIT));

          const snapshot = {};
          const ref = {};

          const result = {
            snapshot,
            ref
          };

          const monitorCall = generator.next(result).value.CALL;
          expect(monitorCall.fn).toBe(sagas.monitorRef);
          expect(monitorCall.args[0]).toBe(ref);
          expect(typeof monitorCall.args[1]).toEqual('function');
          expect(typeof monitorCall.args[2]).toEqual('function');
          expect(typeof monitorCall.args[3]).toEqual('function');

          expect(generator.next().done).toEqual(true);

          const channelPutCalls = channel.put.calls();
          expect(channelPutCalls.length).toBe(1);
          expect(channelPutCalls[0].length).toBe(1);
          expect(channelPutCalls[0][0].type).toEqual('SUCCESS');
          expect(channelPutCalls[0][0].payload.snapshot).toBe(snapshot);
          expect(channelPutCalls[0][0].payload.ref).toBe(ref);
        });
      });

      describe('monitorMovements', () => {
        it('should add listener on all refs', () => {
          const stateSelector = () => {};
          const channel = {
            put: Utils.callTracker()
          };
          const childAddedAction = () => {};
          const childChangedAction = () => {};
          const childRemovedAction = () => {};

          const generator = sagas.monitorMovements(
            stateSelector,
            channel,
            childAddedAction,
            childChangedAction,
            childRemovedAction
          );

          expect(generator.next().value).toEqual(select(stateSelector));

          const ref1 = {};
          const ref2 = {};

          const state = {
            refs: [ref1, ref2]
          };

          const ref1Call = generator.next(state).value.CALL;
          expect(ref1Call.fn).toBe(sagas.monitorRef);
          expect(ref1Call.args[0]).toBe(ref1);
          expect(typeof ref1Call.args[1]).toEqual('function');
          expect(typeof ref1Call.args[2]).toEqual('function');
          expect(typeof ref1Call.args[3]).toEqual('function');

          const ref2Call = generator.next().value.CALL;
          expect(ref2Call.fn).toBe(sagas.monitorRef);
          expect(ref2Call.args[0]).toBe(ref2);
          expect(typeof ref2Call.args[1]).toEqual('function');
          expect(typeof ref2Call.args[2]).toEqual('function');
          expect(typeof ref2Call.args[3]).toEqual('function');

          expect(generator.next().done).toEqual(true);
        });
      });

      describe('monitorRef', () => {
        it('should remove old listeners and attach new ones', () => {
          const ref = {
            off: Utils.callTracker(),
            on: Utils.callTracker()
          };

          const childAdded = () => {};
          const childChanged = () => {};
          const childRemoved = () => {};

          const generator = sagas.monitorRef(ref, childAdded, childChanged, childRemoved);

          expect(generator.next().done).toEqual(true);

          const offCalls = ref.off.calls();
          expect(offCalls.length).toBe(3);
          expect(offCalls[0].length).toBe(1);
          expect(offCalls[0][0]).toBe('child_added');
          expect(offCalls[1].length).toBe(1);
          expect(offCalls[1][0]).toBe('child_changed');
          expect(offCalls[2].length).toBe(1);
          expect(offCalls[2][0]).toBe('child_removed');

          const onCalls = ref.on.calls();
          expect(onCalls.length).toBe(3);
          expect(onCalls[0].length).toBe(2);
          expect(onCalls[0][0]).toBe('child_added');
          expect(onCalls[0][1]).toBe(childAdded);
          expect(onCalls[1].length).toBe(2);
          expect(onCalls[1][0]).toBe('child_changed');
          expect(onCalls[1][1]).toBe(childChanged);
          expect(onCalls[2].length).toBe(2);
          expect(onCalls[2][0]).toBe('child_removed');
          expect(onCalls[2][1]).toBe(childRemoved);
        });
      });
    });
  });
});
