import {select, put, call} from 'redux-saga/effects';
import {initialize, destroy} from 'redux-form';
import dates from '../../util/dates';
import ImmutableItemsArray from '../../util/ImmutableItemsArray';
import * as actions from './actions';
import * as sagas from './sagas';
import * as remote from './remote';
import {LIMIT} from './pagination';
import FakeFirebaseSnapshot from '../../../test/FakeFirebaseSnapshot'
import {addMovements} from "./sagas";

describe('modules', () => {
  describe('movements', () => {
    describe('sagas', () => {
      describe('getDepartureDefaultValues', () => {
        it('should return departure default values', () => {
          const generator = sagas.getDepartureDefaultValues();

          const initialValues = {
            type: 'departure',
            date: dates.localDate(),
            time: dates.localTimeRounded(15, 'up')
          };

          const next = generator.next();

          expect(next.value).toEqual(initialValues);
          expect(next.done).toEqual(true);
        });
      });

      describe('getArrivalDefaultValues', () => {
        it('should return arrival default values', () => {
          const generator = sagas.getArrivalDefaultValues();

          const initialValues = {
            type: 'arrival',
            date: dates.localDate(),
            time: dates.localTimeRounded(15, 'down')
          };

          const next = generator.next();

          expect(next.value).toEqual(initialValues);
          expect(next.done).toEqual(true);
        });
      });

      describe('getDefaultValuesFromArrival', () => {
        it('should return departure default values (from existing arrival)', () => {
          const generator = sagas.getDefaultValuesFromArrival('arrival-key');

          expect(generator.next().value).toEqual(call(remote.loadByKey, '/arrivals', 'arrival-key'));

          const snapshot = new FakeFirebaseSnapshot('departure-key', {
            immatriculation: 'HBKOF',
            dateTime: '2016-10-09T14:00:00.000Z',
            negativeTimestamp: -1476021600000,
            aircraftType: 'DR40',
            mtow: 1000,
            memberNr: '34354',
            lastname: 'Muster',
            firstname: 'Max',
            phone: '+41791234567',
            passengerCount: 2,
            location: 'LSZT',
            flightType: 'private'
          });

          expect(generator.next(snapshot).value).toEqual(call(sagas.getDepartureDefaultValues));

          const initialValues = {
            type: 'departure',
            date: dates.localDate(),
            time: dates.localTimeRounded(15, 'up'),
          };

          const next = generator.next(initialValues);

          const expectedDefaultValues = {
            type: 'departure',
            date: initialValues.date,
            time: initialValues.time,
            immatriculation: 'HBKOF',
            aircraftType: 'DR40',
            mtow: 1000,
            memberNr: '34354',
            lastname: 'Muster',
            firstname: 'Max',
            phone: '+41791234567',
            passengerCount: 2,
            location: 'LSZT',
            flightType: 'private'
          };

          expect(next.value).toEqual(expectedDefaultValues);
          expect(next.done).toEqual(true);
        });
      });

      describe('getDefaultValuesFromDeparture', () => {
        it('should return arrival default values (from existing departure)', () => {
          const generator = sagas.getDefaultValuesFromDeparture('departure-key');

          expect(generator.next().value).toEqual(call(remote.loadByKey, '/departures', 'departure-key'));

          const snapshot = new FakeFirebaseSnapshot('departure-key', {
            immatriculation: 'HBKOF',
            dateTime: '2016-10-09T14:00:00.000Z',
            negativeTimestamp: -1476021600000,
            aircraftType: 'DR40',
            mtow: 1000,
            memberNr: '34354',
            lastname: 'Muster',
            firstname: 'Max',
            phone: '+41791234567',
            passengerCount: 2,
            location: 'LSZT',
            flightType: 'private'
          });

          expect(generator.next(snapshot).value).toEqual(call(sagas.getArrivalDefaultValues));

          const initialValues = {
            type: 'arrival',
            date: dates.localDate(),
            time: dates.localTimeRounded(15, 'down'),
          };

          const next = generator.next(initialValues);

          const expectedDefaultValues = {
            type: 'arrival',
            date: initialValues.date,
            time: initialValues.time,
            immatriculation: 'HBKOF',
            aircraftType: 'DR40',
            mtow: 1000,
            memberNr: '34354',
            lastname: 'Muster',
            firstname: 'Max',
            phone: '+41791234567',
            passengerCount: 2,
            location: 'LSZT',
            flightType: 'private'
          };

          expect(next.value).toEqual(expectedDefaultValues);
          expect(next.done).toEqual(true);
        });
      });

      describe('getOldest', () => {
        it('should return the oldest movement', () => {
          const snapshot = new FakeFirebaseSnapshot(null, [
            new FakeFirebaseSnapshot('dep1', {
              negativeTimestamp: -1493802000000 // May 03 2017 11:00:00
            }),
            new FakeFirebaseSnapshot('dep2', {
              negativeTimestamp: -1493791200000 // May 03 2017 08:00:00
            }),
            new FakeFirebaseSnapshot('dep3', {
              negativeTimestamp: -1493794800000 // May 03 2017 09:00:00
            })
          ]);

          const oldest = sagas.getOldest(snapshot);

          expect(oldest).toEqual({
            negativeTimestamp: -1493791200000 // May 03 2017 08:00:00
          })
        });

        it('should return null if list is empty', () => {
          const snapshot = new FakeFirebaseSnapshot(null, []);
          const oldest = sagas.getOldest(snapshot);
          expect(oldest).toBe(null)
        });
      });

      describe('loadMovements', () => {
        const testFn = clear => {
          const channel = {
            put: jest.fn()
          };

          const action = actions.loadMovements(clear);

          const generator = sagas.loadMovements(channel, action);

          expect(generator.next().value).toEqual(select(sagas.stateSelector));

          const state = {
            loading: false,
            data: new ImmutableItemsArray()
          };

          expect(generator.next(state).value).toEqual(put(actions.setMovementsLoading()));

          expect(generator.next().value)
            .toEqual(call(remote.loadLimited, '/departures', undefined, LIMIT));

          const departuresResult = {
            snapshot: new FakeFirebaseSnapshot(null, [
              new FakeFirebaseSnapshot('dep1', {
                negativeTimestamp: -1493802000000 // May 03 2017 11:00:00
              }),
              new FakeFirebaseSnapshot('dep2', {
                negativeTimestamp: -1493791200000 // May 03 2017 08:00:00
              })
            ]),
            ref: {
              name: 'depRef'
            }
          };

          expect(generator.next(departuresResult).value)
            .toEqual(call(remote.loadLimited, '/arrivals', undefined, null, -1493791200000));

          const arrivalsResult = {
            snapshot: new FakeFirebaseSnapshot(null, [
              new FakeFirebaseSnapshot('arr1', {
                negativeTimestamp: -1493798400000 // May 03 2017 10:00:00
              }),
              new FakeFirebaseSnapshot('arr2', {
                negativeTimestamp: -1493794800000 // May 03 2017 09:00:00
              })
            ]),
            ref: {
              name: 'arrRef'
            }
          };

          const eventActions = {
            added: actions.movementAdded,
            changed: actions.movementChanged,
            removed: actions.movementDeleted
          };

          expect(generator.next(arrivalsResult).value)
            .toEqual(call(sagas.monitorRef, departuresResult.ref, channel, 'departure', eventActions));
          expect(generator.next().value)
            .toEqual(call(sagas.monitorRef, arrivalsResult.ref, channel, 'arrival', eventActions));

          const existingMovements = clear ? new ImmutableItemsArray() : state.data;

          expect(generator.next().value)
            .toEqual(call(sagas.addMovements, departuresResult.snapshot, arrivalsResult.snapshot, existingMovements, channel));

          expect(generator.next().done).toEqual(true);
        };

        it('should load new movements range', () => {
          testFn(undefined)
        });

        it('should load new movements range and clear already loaded data', () => {
          testFn(true)
        });
      });

      describe('monitorRef', () => {
        it('should remove old listeners and attach new ones', () => {
          const ref = {
            off: jest.fn(),
            on: jest.fn()
          };

          const channel = {};

          const eventActions = {
            added: () => {},
            changed: () => {},
            removed: () => {}
          }

          const generator = sagas.monitorRef(ref, channel, 'departure', eventActions);

          expect(generator.next().done).toEqual(true);

          const offCalls = ref.off.mock.calls;
          expect(offCalls.length).toBe(3);
          expect(offCalls[0]).toEqual(['child_added']);
          expect(offCalls[1]).toEqual(['child_changed']);
          expect(offCalls[2]).toEqual(['child_removed']);

          const onCalls = ref.on.mock.calls;
          expect(onCalls.length).toBe(3);

          expect(onCalls[0][0]).toBe('child_added');
          expect(typeof onCalls[0][1]).toBe('function');

          expect(onCalls[1][0]).toBe('child_changed');
          expect(typeof onCalls[1][1]).toBe('function');

          expect(onCalls[2][0]).toBe('child_removed');
          expect(typeof onCalls[2][1]).toBe('function');
        });
      });

      describe('deleteMovement', () => {
        it('should delete a movement and call the success action', () => {
          const successAction = () => ({
            type: 'SUCCESS'
          });
          const action = actions.deleteMovement('departure', 'movement-key', successAction);

          const generator = sagas.deleteMovement(action);

          expect(generator.next().value)
            .toEqual(call(remote.removeMovement, '/departures', 'movement-key'));
          expect(generator.next().value)
            .toEqual(put(successAction()));
          expect(generator.next().done).toEqual(true);
        });
      });

      describe('initNewMovement', () => {
        const testInit = (movementType, defaultValuesSaga) => {
          const action = actions.initNewMovement(movementType);
          const generator = sagas.initNewMovement(action);
          expect(generator.next().value).toEqual(call(sagas.initMovement, defaultValuesSaga));
          expect(generator.next().done).toEqual(true);
        };

        it('should init new departure', () => {
          testInit('departure', sagas.getDepartureDefaultValues)
        });

        it('should init new arrival', () => {
          testInit('arrival', sagas.getArrivalDefaultValues)
        });
      });

      describe('initNewMovementFromMovement', () => {
        const testInit = (movementType, sourceMovementType, sourceMovementKey, defaultValuesSaga) => {
          const action = actions.initNewMovementFromMovement(movementType, sourceMovementType, sourceMovementKey);

          const generator = sagas.initNewMovementFromMovement(action);

          expect(generator.next().value).toEqual(call(sagas.initMovement, defaultValuesSaga, sourceMovementKey));
          expect(generator.next().done).toEqual(true);
        };

        it('should init new departure from arrival', () => {
          testInit('departure', 'arrival', 'arrival-key', sagas.getDefaultValuesFromArrival)
        });

        it('should init new arrival from departure', () => {
          testInit('arrival', 'departure', 'departure-key', sagas.getDefaultValuesFromDeparture)
        });
      });

      describe('initMovement', () => {
        it('should init a new movement', () => {
          const defaultValuesSaga = sagas.getDefaultValuesFromArrival;
          const arrivalKey = 'arrival-key';

          const generator = sagas.initMovement(defaultValuesSaga, arrivalKey);

          expect(generator.next().value).toEqual(put(actions.startInitializeWizard()));
          expect(generator.next().value).toEqual(put(destroy('wizard')));
          expect(generator.next().value).toEqual(call(defaultValuesSaga, arrivalKey));

          const defaultValues = {
            test: 'foo'
          };

          expect(generator.next(defaultValues).value).toEqual(put(initialize('wizard', defaultValues)));

          expect(generator.next().value).toEqual(put(actions.wizardInitialized()));

          expect(generator.next().done).toEqual(true);
        });
      });

      describe('editMovement', () => {
        it('should init movement edit wizard for loaded wizard', () => {
          const action = actions.editMovement('departure', 'departure-key');

          const generator = sagas.editMovement(action);

          expect(generator.next().value).toEqual(put(actions.startInitializeWizard()));
          expect(generator.next().value).toEqual(put(destroy('wizard')));

          expect(generator.next().value).toEqual(select(sagas.movementSelector, 'departure-key'));

          const movement = {
            type: 'departure',
            immatriculation: 'HBABC',
            date: '2016-10-09',
            time: '16:00',
          };

          expect(generator.next(movement).value).toEqual(put(initialize('wizard', movement)));
          expect(generator.next().value).toEqual(put(actions.wizardInitialized()));

          expect(generator.next().done).toEqual(true);
        });

        it('should load movement and init movement edit wizard', () => {
          const action = actions.editMovement('departure', 'departure-key');

          const generator = sagas.editMovement(action);

          expect(generator.next().value).toEqual(put(actions.startInitializeWizard()));
          expect(generator.next().value).toEqual(put(destroy('wizard')));

          expect(generator.next().value).toEqual(select(sagas.movementSelector, 'departure-key'));

          const movement = null;

          expect(generator.next(movement).value).toEqual(call(remote.loadByKey, '/departures', 'departure-key'));

          const snapshot = new FakeFirebaseSnapshot('departure-key', {
            immatriculation: 'HBABC',
            dateTime: '2016-10-09T14:00:00.000Z',
            negativeTimestamp: -1476021600000
          });

          const expectedMovementData = {
            type: 'departure',
            key: 'departure-key',
            immatriculation: 'HBABC',
            date: '2016-10-09',
            time: '16:00'
          };

          expect(generator.next(snapshot).value).toEqual(put(initialize('wizard', expectedMovementData)));
          expect(generator.next().value).toEqual(put(actions.wizardInitialized()));

          expect(generator.next().done).toEqual(true);
        });
      });

      describe('saveMovement', () => {
        it('should save movement', () => {
          const generator = sagas.saveMovement();

          expect(generator.next().value).toEqual(select(sagas.wizardFormValuesSelector));

          const formValues = {
            type: 'departure',
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

          expect(generator.next(key).value).toEqual(put(actions.saveMovementSuccess(key, formValues)));

          expect(generator.next().done).toEqual(true);
        });
      });
    });
  });
});
