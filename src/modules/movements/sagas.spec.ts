import {call, put, select} from 'redux-saga/effects';
import dates from '../../util/dates';
import ImmutableItemsArray from '../../util/ImmutableItemsArray';
import * as actions from './actions';
import * as sagas from './sagas';
import * as remote from './remote';
import {addMovementAssociationListener, removeMovementAssociationListener} from './remote';
import {LIMIT} from './pagination';
import FakeFirebaseSnapshot from '../../../test/FakeFirebaseSnapshot'
import {loadRemote} from '../profile'
import {compareDescending, firebaseToLocal} from '../../util/movements'
import {onChildAdded, onChildChanged, onChildRemoved} from 'firebase/database';
import {history} from '../../history'

jest.mock('./remote');
jest.mock('firebase/database', () => ({
  onChildAdded: jest.fn(() => jest.fn()),
  onChildChanged: jest.fn(() => jest.fn()),
  onChildRemoved: jest.fn(() => jest.fn()),
}));

describe('modules', () => {
  describe('movements', () => {
    describe('sagas', () => {
      describe('getDepartureDefaultValues', () => {
        it('should return departure default values', () => {
          const generator = sagas.getDepartureDefaultValues();

          expect(generator.next().value).toEqual(call(sagas.getProfileDefaultValues));

          const profileDefaults = {
            firstname: 'John',
            lastname: 'Doe',
          }

          const next = generator.next(profileDefaults);

          const initialValues = {
            firstname: 'John',
            lastname: 'Doe',
            type: 'departure',
            date: dates.localDate(),
            time: dates.localTimeRounded(15, 'up')
          };

          expect(next.value).toEqual(initialValues);
          expect(next.done).toEqual(true);
        });
      });

      describe('getArrivalDefaultValues', () => {
        it('should return arrival default values', () => {
          const generator = sagas.getArrivalDefaultValues();

          expect(generator.next().value).toEqual(call(sagas.getProfileDefaultValues));

          const profileDefaults = {
            firstname: 'John',
            lastname: 'Doe',
          }

          const next = generator.next(profileDefaults);

          const initialValues = {
            firstname: 'John',
            lastname: 'Doe',
            type: 'arrival',
            date: dates.localDate(),
            time: dates.localTimeRounded(15, 'down')
          };

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

          expect(generator.next(state as any).value).toEqual(put(actions.setMovementsLoading()));

          expect(generator.next().value)
            .toEqual(call(sagas.loadDeparturesAndArrivals, state, clear));

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

          const loadResult = {
            departures: departuresResult,
            arrivals: arrivalsResult
          }

          const eventActions = {
            added: actions.movementAdded,
            changed: actions.movementChanged,
            removed: actions.movementDeleted
          };

          expect(generator.next(loadResult).value)
            .toEqual(call(sagas.monitorRef, departuresResult.ref, channel, 'departure', eventActions));
          expect(generator.next().value)
            .toEqual(call(sagas.monitorRef, arrivalsResult.ref, channel, 'arrival', eventActions));

          const existingMovements = clear ? new ImmutableItemsArray() : state.data;

          expect(generator.next().value)
            .toEqual(call(sagas.addMovements, departuresResult.snapshot, arrivalsResult.snapshot, existingMovements, channel));

          if (clear) {
            expect(generator.next().value).toEqual(put(actions.clearMovementsByKey()));
            expect(generator.next().value).toEqual(put(actions.clearAssociatedMovements()));
          }

          expect(generator.next().done).toEqual(true);
        };

        it('should load new movements range', () => {
          testFn(undefined)
        });

        it('should load new movements range and clear already loaded data', () => {
          testFn(true)
        });
      });

      describe('loadLatestDeparturesAndArrivalsPaged', () => {
        it('should load departures and arrivals paged', () => {
          const state = {
            loading: false,
            data: new ImmutableItemsArray()
          };

          const generator = sagas.loadLatestDeparturesAndArrivalsPaged(state, false);

          expect(generator.next().value)
            .toEqual(select(sagas.authSelector));

          const auth = {
            email: 'pilot@example.com'
          }

          expect(generator.next(auth).value)
            .toEqual(call(remote.loadLimited, '/departures', undefined, LIMIT, undefined, 'pilot@example.com'));

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
            .toEqual(call(remote.loadLimited, '/arrivals', undefined, 10, undefined, 'pilot@example.com'));

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

          expect(generator.next(arrivalsResult).value)
            .toEqual(call(remote.loadLimited, '/arrivals', undefined, undefined, -1493791200000, 'pilot@example.com'));

          const next = generator.next(arrivalsResult);

          const expectedResult = {
            departures: departuresResult,
            arrivals: arrivalsResult
          }

          expect(next.value).toEqual(expectedResult);
          expect(next.done).toEqual(true);
        });
      });

      describe('monitorRef', () => {
        it('should attach child event listeners', () => {
          const ref = {};
          const channel = {};
          const eventActions = {
            added: () => {},
            changed: () => {},
            removed: () => {}
          };

          const generator = sagas.monitorRef(ref, channel, 'departure', eventActions);
          expect(generator.next().done).toEqual(true);

          expect(onChildAdded).toHaveBeenCalledWith(ref, expect.any(Function));
          expect(onChildChanged).toHaveBeenCalledWith(ref, expect.any(Function));
          expect(onChildRemoved).toHaveBeenCalledWith(ref, expect.any(Function));
        });

        it('should call previous unsubscribers when called again', () => {
          const mockUnsubscribe = jest.fn();
          (onChildAdded as jest.Mock).mockReturnValue(mockUnsubscribe);
          (onChildChanged as jest.Mock).mockReturnValue(mockUnsubscribe);
          (onChildRemoved as jest.Mock).mockReturnValue(mockUnsubscribe);

          const ref = {};
          const channel = {};
          const eventActions = { added: () => {}, changed: () => {}, removed: () => {} };

          sagas.monitorRef(ref, channel, 'departure', eventActions).next();
          sagas.monitorRef(ref, channel, 'departure', eventActions).next();

          expect(mockUnsubscribe).toHaveBeenCalledTimes(3);
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
          expect(generator.next().value).toEqual(call(defaultValuesSaga, arrivalKey));

          const defaultValues = {
            test: 'foo'
          };

          expect(generator.next(defaultValues).value).toEqual(put(actions.wizardInitialized(defaultValues)));

          expect(generator.next().done).toEqual(true);
        });
      });

      describe('editMovement', () => {
        it('should init movement edit wizard for loaded wizard', () => {
          const action = actions.editMovement('departure', 'departure-key');

          const generator = sagas.editMovement(action);

          expect(generator.next().value).toEqual(put(actions.startInitializeWizard()));

          expect(generator.next().value).toEqual(select(sagas.movementSelector, 'departure-key'));

          const movement = {
            type: 'departure',
            immatriculation: 'HBABC',
            date: '2016-10-09',
            time: '16:00',
          };

          expect(generator.next(movement).value).toEqual(put(actions.wizardInitialized(movement)));

          expect(generator.next().done).toEqual(true);
        });

        it('should load movement and init movement edit wizard', () => {
          const action = actions.editMovement('departure', 'departure-key');

          const generator = sagas.editMovement(action);

          expect(generator.next().value).toEqual(put(actions.startInitializeWizard()));

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

          expect(generator.next(snapshot).value).toEqual(put(actions.wizardInitialized(expectedMovementData)));

          expect(generator.next().done).toEqual(true);
        });

        it('should navigate back when movement not found in firebase', () => {
          const action = actions.editMovement('departure', 'deleted-key');

          const generator = sagas.editMovement(action);

          expect(generator.next().value).toEqual(put(actions.startInitializeWizard()));

          expect(generator.next().value).toEqual(select(sagas.movementSelector, 'deleted-key'));

          expect(generator.next(null).value).toEqual(call(remote.loadByKey, '/departures', 'deleted-key'));

          const snapshot = new FakeFirebaseSnapshot('deleted-key', null);

          const pushSpy = jest.spyOn(history, 'push');
          generator.next(snapshot);

          expect(pushSpy).toHaveBeenCalledWith('/');
          expect(generator.next().done).toEqual(true);
          pushSpy.mockRestore();
        });
      });

      describe('saveMovement', () => {
        it('should save movement with consent timestamp when privacyPolicyUrl is set', () => {
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

          expect(generator.next(formValues).value).toEqual(select(sagas.authSelector));

          const auth = {
            email: 'pilot@example.com'
          }

          expect(generator.next(auth).value).toEqual(select(sagas.privacyPolicyUrlSelector));

          const expectedMovementForFirebase = {
            ...formValuesForFirebase,
            createdBy: 'pilot@example.com',
            createdBy_orderKey: 'pilot@example.com_8523978399999',
            privacyPolicyAcceptedAt: expect.any(String)
          };

          expect(generator.next('https://example.com/privacy').value)
            .toEqual(call(remote.saveMovement, '/departures', undefined, expectedMovementForFirebase));

          const key = 'new-departure-key';

          expect(generator.next(key).value).toEqual(put(actions.saveMovementSuccess(key, formValues)));

          expect(generator.next().done).toEqual(true);
        });

        it('should save movement without consent timestamp when privacyPolicyUrl is not set', () => {
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

          expect(generator.next(formValues).value).toEqual(select(sagas.authSelector));

          const auth = {
            email: 'pilot@example.com'
          }

          expect(generator.next(auth).value).toEqual(select(sagas.privacyPolicyUrlSelector));

          const expectedMovementForFirebase = {
            ...formValuesForFirebase,
            createdBy: 'pilot@example.com',
            createdBy_orderKey: 'pilot@example.com_8523978399999',
          };

          expect(generator.next(null).value)
            .toEqual(call(remote.saveMovement, '/departures', undefined, expectedMovementForFirebase));

          const key = 'new-departure-key';

          expect(generator.next(key).value).toEqual(put(actions.saveMovementSuccess(key, formValues)));

          expect(generator.next().done).toEqual(true);
        });
      });

      describe('getProfileDefaultValues', () => {
        it('should return empty object if no auth', () => {
          const generator = sagas.getProfileDefaultValues();

          expect(generator.next().value).toEqual(select(sagas.authSelector));

          const next = generator.next(null);
          expect(next.value).toEqual({});
          expect(next.done).toEqual(true);
        });

        it('should return empty object if auth has no uid', () => {
          const generator = sagas.getProfileDefaultValues();

          expect(generator.next().value).toEqual(select(sagas.authSelector));

          const next = generator.next({});
          expect(next.value).toEqual({});
          expect(next.done).toEqual(true);
        });

        it('should return empty object if auth is guest', () => {
          const generator = sagas.getProfileDefaultValues();

          expect(generator.next().value).toEqual(select(sagas.authSelector));

          const next = generator.next({ uid: 'guest-uid', guest: true });
          expect(next.value).toEqual({});
          expect(next.done).toEqual(true);
        });

        it('should return empty object if auth is kiosk', () => {
          const generator = sagas.getProfileDefaultValues();

          expect(generator.next().value).toEqual(select(sagas.authSelector));

          const next = generator.next({ uid: 'kiosk-uid', kiosk: true });
          expect(next.value).toEqual({});
          expect(next.done).toEqual(true);
        });

        it('should load profile and return only movement-relevant fields', () => {
          const generator = sagas.getProfileDefaultValues();

          expect(generator.next().value).toEqual(select(sagas.authSelector));

          const auth = { uid: 'user-123' };
          expect(generator.next(auth).value).toEqual(call(loadRemote, 'user-123'));

          const profileData = {
            memberNr: '42',
            email: 'john@example.com',
            firstname: 'John',
            lastname: 'Doe',
            phone: '+41791234567',
            immatriculation: 'HBABC',
            aircraftCategory: 'Motorflugzeug',
            aircraftType: 'C172',
            mtow: 1111,
            language: 'en',
          };
          const snapshot = { val: () => profileData };

          const next = generator.next(snapshot);
          expect(next.value).toEqual({
            memberNr: '42',
            email: 'john@example.com',
            firstname: 'John',
            lastname: 'Doe',
            phone: '+41791234567',
            immatriculation: 'HBABC',
            aircraftCategory: 'Motorflugzeug',
            aircraftType: 'C172',
            mtow: 1111,
          });
          expect(next.done).toEqual(true);
        });

        it('should not include fields absent from profile', () => {
          const generator = sagas.getProfileDefaultValues();

          expect(generator.next().value).toEqual(select(sagas.authSelector));

          const auth = { uid: 'user-123' };
          expect(generator.next(auth).value).toEqual(call(loadRemote, 'user-123'));

          const snapshot = { val: () => ({ firstname: 'John', language: 'en' }) };

          const next = generator.next(snapshot);
          expect(next.value).toEqual({ firstname: 'John' });
          expect(next.done).toEqual(true);
        });
      });

      describe('filterMovements', () => {
        it('should dispatch loadMovements if filter date changed', () => {
          const generator = sagas.filterMovements();

          expect(generator.next().value).toEqual(select(sagas.stateSelector));

          const state = {
            filter: {
              date: { start: '2017-05-01', end: '2017-05-31' }
            },
            previousFilter: {
              date: { start: '2017-04-01', end: '2017-04-30' }
            }
          };

          expect(generator.next(state).value).toEqual(put(actions.loadMovements(true)));
          expect(generator.next().done).toEqual(true);
        });

        it('should not dispatch loadMovements if filter date not changed', () => {
          const generator = sagas.filterMovements();

          expect(generator.next().value).toEqual(select(sagas.stateSelector));

          const state = {
            filter: {
              date: { start: '2017-05-01', end: '2017-05-31' }
            },
            previousFilter: {
              date: { start: '2017-05-01', end: '2017-05-31' }
            }
          };

          expect(generator.next(state).done).toEqual(true);
        });
      });

      describe('saveMovementPaymentMethod', () => {
        it('should save movement payment method', () => {
          const key = 'dep-key-1';
          const paymentMethod = 'cash';
          const action = actions.saveMovementPaymentMethod('departure', key, paymentMethod);

          const generator = sagas.saveMovementPaymentMethod(action);

          expect(generator.next().value).toEqual(
            call(remote.saveMovement, '/departures', key, { paymentMethod })
          );
          expect(generator.next().done).toEqual(true);
        });

        it('should handle errors silently', () => {
          const key = 'dep-key-1';
          const paymentMethod = 'cash';
          const action = actions.saveMovementPaymentMethod('departure', key, paymentMethod);

          const generator = sagas.saveMovementPaymentMethod(action);

          expect(generator.next().value).toEqual(
            call(remote.saveMovement, '/departures', key, { paymentMethod })
          );

          const error = new Error('save failed');
          expect(generator.throw(error).done).toEqual(true);
        });
      });

      describe('saveMovement error path', () => {
        it('should put saveMovementFailed on error', () => {
          const generator = sagas.saveMovement();

          expect(generator.next().value).toEqual(select(sagas.wizardFormValuesSelector));

          const formValues = {
            type: 'departure',
            immatriculation: 'HBABC',
            date: '2016-10-09',
            time: '16:00',
          };

          expect(generator.next(formValues).value).toEqual(select(sagas.authSelector));

          const auth = { email: 'pilot@example.com' };

          expect(generator.next(auth).value).toEqual(select(sagas.privacyPolicyUrlSelector));

          expect(generator.next(null).value).toMatchObject({ type: 'CALL' });

          const error = new Error('save failed');
          expect(generator.throw(error).value).toEqual(put(actions.saveMovementFailed(error)));

          expect(generator.next().done).toEqual(true);
        });
      });

      describe('loadMovement', () => {
        it('should load a departure by key and dispatch addMovementByKey', () => {
          const action = actions.loadMovement('departure-key', 'departure');
          const generator = sagas.loadMovement(action);

          expect(generator.next().value).toEqual(
            call(remote.loadByKey, '/departures', 'departure-key')
          );

          const snapshot = new FakeFirebaseSnapshot('departure-key', {
            immatriculation: 'HBABC',
            dateTime: '2016-10-09T14:00:00.000Z',
            negativeTimestamp: -1476021600000
          });

          const expectedMovement = {
            immatriculation: 'HBABC',
            date: '2016-10-09',
            time: '16:00',
            key: 'departure-key',
            type: 'departure'
          };

          expect(generator.next(snapshot).value).toEqual(
            put(actions.addMovementByKey(expectedMovement))
          );

          expect(generator.next().done).toEqual(true);
        });

        it('should load an arrival by key and dispatch addMovementByKey', () => {
          const action = actions.loadMovement('arrival-key', 'arrival');
          const generator = sagas.loadMovement(action);

          expect(generator.next().value).toEqual(
            call(remote.loadByKey, '/arrivals', 'arrival-key')
          );

          const snapshot = new FakeFirebaseSnapshot('arrival-key', {
            immatriculation: 'HBKOF',
            dateTime: '2017-05-03T09:00:00.000Z',
            negativeTimestamp: -1493802000000
          });

          expect(generator.next(snapshot).value).toMatchObject({
            type: 'PUT'
          });

          expect(generator.next().done).toEqual(true);
        });

        it('should return early when movement not found', () => {
          const action = actions.loadMovement('deleted-key', 'departure');
          const generator = sagas.loadMovement(action);

          expect(generator.next().value).toEqual(
            call(remote.loadByKey, '/departures', 'deleted-key')
          );

          const snapshot = new FakeFirebaseSnapshot('deleted-key', null);

          expect(generator.next(snapshot).done).toEqual(true);
        });
      });

      describe('loadDeparturesAndArrivals', () => {
        it('should call loadDeparturesAndArrivalsFiltered when date filter is set', () => {
          const movements = {
            filter: { date: { start: '2017-05-01', end: '2017-05-31' } },
            data: new ImmutableItemsArray()
          };

          const generator = sagas.loadDeparturesAndArrivals(movements, false);

          expect(generator.next().value).toEqual(
            call(sagas.loadDeparturesAndArrivalsFiltered, movements)
          );

          expect(generator.next().done).toEqual(true);
        });

        it('should call loadLatestDeparturesAndArrivalsPaged when no date filter', () => {
          const movements = {
            filter: { date: { start: null, end: null } },
            data: new ImmutableItemsArray()
          };

          const generator = sagas.loadDeparturesAndArrivals(movements, false);

          expect(generator.next().value).toEqual(
            call(sagas.loadLatestDeparturesAndArrivalsPaged, movements, false)
          );

          expect(generator.next().done).toEqual(true);
        });
      });

      describe('loadDeparturesAndArrivalsFiltered', () => {
        it('should call remote.loadLimited for departures and arrivals with date range', () => {
          const movements = {
            filter: { date: { start: '2017-05-01', end: '2017-05-31' } }
          };

          const generator = sagas.loadDeparturesAndArrivalsFiltered(movements);

          const start = dates.negativeTimestampEndOfDay('2017-05-31');
          const end = dates.negativeTimestampStartOfDay('2017-05-01');

          expect(generator.next().value).toEqual(
            call(remote.loadLimited, '/departures', start, null, end)
          );

          const departuresResult = { snapshot: {}, ref: {} };
          expect(generator.next(departuresResult).value).toEqual(
            call(remote.loadLimited, '/arrivals', start, null, end)
          );

          const arrivalsResult = { snapshot: {}, ref: {} };
          const result = generator.next(arrivalsResult);

          expect(result.value).toEqual({ departures: departuresResult, arrivals: arrivalsResult });
          expect(result.done).toEqual(true);
        });
      });

      describe('getReloadParams', () => {
        it('should return reload arrivals when departure is older', () => {
          const movements = {
            departures: {
              snapshot: new FakeFirebaseSnapshot(null, [
                new FakeFirebaseSnapshot('dep1', { negativeTimestamp: -1493791200000 }) // older (larger value)
              ])
            },
            arrivals: {
              snapshot: new FakeFirebaseSnapshot(null, [
                new FakeFirebaseSnapshot('arr1', { negativeTimestamp: -1493802000000 }) // newer (smaller value)
              ])
            }
          };

          const result = sagas.getReloadParams(movements);
          expect(result).toEqual({
            reloadType: 'arrivals',
            reloadEnd: -1493791200000
          });
        });

        it('should return reload departures when arrival is older', () => {
          const movements = {
            departures: {
              snapshot: new FakeFirebaseSnapshot(null, [
                new FakeFirebaseSnapshot('dep1', { negativeTimestamp: -1493802000000 }) // newer
              ])
            },
            arrivals: {
              snapshot: new FakeFirebaseSnapshot(null, [
                new FakeFirebaseSnapshot('arr1', { negativeTimestamp: -1493791200000 }) // older
              ])
            }
          };

          const result = sagas.getReloadParams(movements);
          expect(result).toEqual({
            reloadType: 'departures',
            reloadEnd: -1493791200000
          });
        });

        it('should return reload arrivals when only departures exist', () => {
          const movements = {
            departures: {
              snapshot: new FakeFirebaseSnapshot(null, [
                new FakeFirebaseSnapshot('dep1', { negativeTimestamp: -1493802000000 })
              ])
            },
            arrivals: {
              snapshot: new FakeFirebaseSnapshot(null, [])
            }
          };

          const result = sagas.getReloadParams(movements);
          expect(result).toEqual({
            reloadType: 'arrivals',
            reloadEnd: -1493802000000
          });
        });

        it('should return reload departures when only arrivals exist', () => {
          const movements = {
            departures: {
              snapshot: new FakeFirebaseSnapshot(null, [])
            },
            arrivals: {
              snapshot: new FakeFirebaseSnapshot(null, [
                new FakeFirebaseSnapshot('arr1', { negativeTimestamp: -1493802000000 })
              ])
            }
          };

          const result = sagas.getReloadParams(movements);
          expect(result).toEqual({
            reloadType: 'departures',
            reloadEnd: -1493802000000
          });
        });

        it('should return null when both collections are empty', () => {
          const movements = {
            departures: { snapshot: new FakeFirebaseSnapshot(null, []) },
            arrivals: { snapshot: new FakeFirebaseSnapshot(null, []) }
          };

          const result = sagas.getReloadParams(movements);
          expect(result).toBeNull();
        });
      });

      describe('addMovements', () => {
        it('should filter movements by auth.email for non-admin users', () => {
          const channel = { put: jest.fn() };

          const departuresSnapshot = new FakeFirebaseSnapshot(null, [
            new FakeFirebaseSnapshot('dep1', {
              immatriculation: 'HBABC',
              dateTime: '2017-05-03T09:00:00.000Z',
              negativeTimestamp: -1493802000000,
              createdBy: 'pilot@example.com'
            })
          ]);

          const arrivalsSnapshot = new FakeFirebaseSnapshot(null, [
            new FakeFirebaseSnapshot('arr1', {
              immatriculation: 'HBKOF',
              dateTime: '2017-05-03T10:00:00.000Z',
              negativeTimestamp: -1493798400000,
              createdBy: 'other@example.com'
            })
          ]);

          const existingMovements = new ImmutableItemsArray();
          const generator = sagas.addMovements(
            departuresSnapshot, arrivalsSnapshot, existingMovements, channel
          );

          expect(generator.next().value).toEqual(select(sagas.authSelector));

          const auth = { admin: false, email: 'pilot@example.com' };
          expect(generator.next(auth).value).toEqual(
            call(sagas.monitorAssociations, expect.anything(), existingMovements, channel)
          );

          expect(generator.next().done).toEqual(true);
          expect(channel.put).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'SET_MOVEMENTS' })
          );
        });

        it('should include all movements for admin users', () => {
          const channel = { put: jest.fn() };

          const departuresSnapshot = new FakeFirebaseSnapshot(null, [
            new FakeFirebaseSnapshot('dep1', {
              immatriculation: 'HBABC',
              dateTime: '2017-05-03T09:00:00.000Z',
              negativeTimestamp: -1493802000000,
              createdBy: 'pilot@example.com'
            })
          ]);

          const arrivalsSnapshot = new FakeFirebaseSnapshot(null, []);

          const existingMovements = new ImmutableItemsArray();
          const generator = sagas.addMovements(
            departuresSnapshot, arrivalsSnapshot, existingMovements, channel
          );

          expect(generator.next().value).toEqual(select(sagas.authSelector));

          const auth = { admin: true, email: 'admin@example.com' };
          expect(generator.next(auth).value).toEqual(
            call(sagas.monitorAssociations, expect.anything(), existingMovements, channel)
          );

          expect(generator.next().done).toEqual(true);
        });
      });

      describe('monitorAssociations', () => {
        beforeEach(() => {
          (addMovementAssociationListener as jest.Mock).mockClear();
          (removeMovementAssociationListener as jest.Mock).mockClear();
        });

        it('should add listeners for new movements and remove for deleted', () => {
          const channel = { put: jest.fn() };

          const existingMovement = { key: 'dep1', type: 'departure' };
          const newMovement = { key: 'dep2', type: 'departure' };

          const oldMovements = new ImmutableItemsArray([existingMovement]);
          const newMovements = new ImmutableItemsArray([newMovement]);

          const generator = sagas.monitorAssociations(newMovements, oldMovements, channel);

          expect(generator.next().done).toEqual(true);

          expect(addMovementAssociationListener).toHaveBeenCalledWith(
            'departure', 'dep2', expect.any(Function)
          );
          expect(removeMovementAssociationListener).toHaveBeenCalledWith('departure', 'dep1');
        });
      });

      describe('movementAdded', () => {
        it('should call addMovementToState', () => {
          const channel = { put: jest.fn() };
          const snapshot = new FakeFirebaseSnapshot('dep1', {
            immatriculation: 'HBABC',
            dateTime: '2017-05-03T09:00:00.000Z',
            negativeTimestamp: -1493802000000
          });
          const action = actions.movementAdded(snapshot, 'departure');

          const generator = sagas.movementAdded(channel, action);

          expect(generator.next().value).toEqual(select(sagas.stateSelector));

          const state = { data: new ImmutableItemsArray() };

          expect(generator.next(state).value).toEqual(
            call(sagas.addMovementToState, snapshot, 'departure', state, channel, true)
          );

          expect(generator.next().done).toEqual(true);
        });
      });

      describe('movementChanged', () => {
        it('should remove then add the movement', () => {
          const channel = { put: jest.fn() };
          const snapshot = new FakeFirebaseSnapshot('dep1', {
            immatriculation: 'HBABC',
            dateTime: '2017-05-03T09:00:00.000Z',
            negativeTimestamp: -1493802000000
          });
          const action = actions.movementChanged(snapshot, 'departure');

          const generator = sagas.movementChanged(channel, action);

          expect(generator.next().value).toEqual(
            call(sagas.removeMovementFromState, snapshot, channel)
          );

          const currentState = { data: new ImmutableItemsArray() };

          expect(generator.next(currentState).value).toEqual(
            call(sagas.addMovementToState, snapshot, 'departure', currentState, channel, false)
          );

          expect(generator.next().done).toEqual(true);
        });
      });

      describe('movementDeleted', () => {
        it('should call removeMovementFromState', () => {
          const channel = { put: jest.fn() };
          const snapshot = new FakeFirebaseSnapshot('dep1', {});
          const action = actions.movementDeleted(snapshot, 'departure');

          const generator = sagas.movementDeleted(channel, action);

          expect(generator.next().value).toEqual(
            call(sagas.removeMovementFromState, snapshot, channel)
          );

          expect(generator.next().done).toEqual(true);
        });
      });

      describe('removeMovementFromState', () => {
        it('should return early with current data if movement not found', () => {
          const channel = { put: jest.fn() };
          const snapshot = new FakeFirebaseSnapshot('dep-not-found', {});

          const existingData = new ImmutableItemsArray([]);
          const generator = sagas.removeMovementFromState(snapshot, channel);

          expect(generator.next().value).toEqual(select(sagas.stateSelector));

          const state = { data: existingData };
          const result = generator.next(state);

          expect(result.value).toEqual({ data: existingData });
          expect(result.done).toEqual(true);
          expect(channel.put).not.toHaveBeenCalled();
        });

        it('should remove movement and put setMovements', () => {
          const channel = { put: jest.fn() };
          const movement = {
            key: 'dep1',
            type: 'departure',
            immatriculation: 'HBABC',
            date: '2017-05-03',
            time: '09:00'
          };

          const existingData = new ImmutableItemsArray([movement]);
          const snapshot = new FakeFirebaseSnapshot('dep1', {});

          const generator = sagas.removeMovementFromState(snapshot, channel);

          expect(generator.next().value).toEqual(select(sagas.stateSelector));

          const state = { data: existingData };
          expect(generator.next(state).value).toEqual(
            call(removeMovementAssociationListener, 'departure', 'dep1')
          );

          expect(generator.next().done).toEqual(true);
          expect(channel.put).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'SET_MOVEMENTS' })
          );
        });
      });

      describe('addMovementToState', () => {
        beforeEach(() => {
          (addMovementAssociationListener as jest.Mock).mockClear();
        });

        it('should not add movement if it already exists in state', () => {
          const channel = { put: jest.fn() };
          const existingMovement = {
            key: 'dep1',
            type: 'departure',
            immatriculation: 'HBABC',
            date: '2017-05-03',
            time: '09:00'
          };
          const existingData = new ImmutableItemsArray([existingMovement]);
          const snapshot = new FakeFirebaseSnapshot('dep1', {
            immatriculation: 'HBABC',
            dateTime: '2017-05-03T09:00:00.000Z',
            negativeTimestamp: -1493802000000
          });

          const generator = sagas.addMovementToState(
            snapshot, 'departure', { data: existingData }, channel
          );

          expect(generator.next().done).toEqual(true);
          expect(channel.put).not.toHaveBeenCalled();
        });

        it('should not add movement if user email does not match createdBy', () => {
          const channel = { put: jest.fn() };
          const existingData = new ImmutableItemsArray([]);
          const snapshot = new FakeFirebaseSnapshot('dep1', {
            immatriculation: 'HBABC',
            dateTime: '2017-05-03T09:00:00.000Z',
            negativeTimestamp: -1493802000000,
            createdBy: 'other@example.com'
          });

          const generator = sagas.addMovementToState(
            snapshot, 'departure', { data: existingData }, channel
          );

          expect(generator.next().value).toEqual(select(sagas.authSelector));

          const auth = { admin: false, email: 'pilot@example.com' };
          expect(generator.next(auth).done).toEqual(true);
          expect(channel.put).not.toHaveBeenCalled();
        });

        it('should call monitorAssociation and set movements when movement is new and not last element', () => {
          const channel = { put: jest.fn() };
          const recentMovement = {
            key: 'dep1', type: 'departure', immatriculation: 'HBAAA',
            date: '2022-01-01', time: '10:00'
          };
          const oldMovement = {
            key: 'dep3', type: 'departure', immatriculation: 'HBAAA',
            date: '2000-01-01', time: '10:00'
          };
          const existingData = new ImmutableItemsArray([recentMovement, oldMovement]);
          const snapshotVal = {
            immatriculation: 'HBABC',
            dateTime: '2011-01-01T10:00:00.000Z',
            negativeTimestamp: -1293879600000
          };
          const snapshot = new FakeFirebaseSnapshot('dep2', snapshotVal);

          const generator = sagas.addMovementToState(
            snapshot, 'departure', { data: existingData }, channel
          );

          expect(generator.next().value).toEqual(select(sagas.authSelector));

          const auth = { admin: true };
          const expectedMovement = {
            ...firebaseToLocal(snapshotVal as any),
            key: 'dep2',
            type: 'departure'
          } as any;
          const expectedNewData = existingData.insert(expectedMovement, compareDescending);

          expect(generator.next(auth).value).toEqual(
            call(sagas.monitorAssociation, expectedMovement, channel)
          );

          generator.next();
          expect(channel.put).toHaveBeenCalledWith(actions.setMovements(expectedNewData));
        });

        it('should skip and not call monitorAssociation when movement ends up as last element (fill-in guard)', () => {
          const channel = { put: jest.fn() };
          const recentMovement = {
            key: 'dep1', type: 'departure', immatriculation: 'HBAAA',
            date: '2022-01-01', time: '10:00'
          };
          const existingData = new ImmutableItemsArray([recentMovement]);
          const snapshot = new FakeFirebaseSnapshot('dep2', {
            immatriculation: 'HBABC',
            dateTime: '2000-01-01T00:00:00.000Z',
            negativeTimestamp: -946684800000
          });

          const generator = sagas.addMovementToState(
            snapshot, 'departure', { data: existingData }, channel, true
          );

          expect(generator.next().value).toEqual(select(sagas.authSelector));

          const auth = { admin: true };
          expect(generator.next(auth).done).toEqual(true);
          expect(channel.put).not.toHaveBeenCalled();
        });
      });

      describe('createDelegate', () => {
        it('returns a function that calls channel.put with action result', () => {
          const channel = { put: jest.fn() };
          const action = jest.fn().mockReturnValue({ type: 'SOME_ACTION' });
          const snapshot = { key: 'snap1' };

          const delegate = sagas.createDelegate(channel, action, 'departure');
          delegate(snapshot);

          expect(action).toHaveBeenCalledWith(snapshot, 'departure');
          expect(channel.put).toHaveBeenCalledWith({ type: 'SOME_ACTION' });
        });
      });

      describe('monitorAssociation', () => {
        beforeEach(() => {
          (addMovementAssociationListener as jest.Mock).mockClear();
        });

        it('calls addMovementAssociationListener with correct args and invokes callback', () => {
          const channel = { put: jest.fn() };
          const movement = { type: 'departure', key: 'dep1' };

          sagas.monitorAssociation(movement, channel);

          expect(addMovementAssociationListener).toHaveBeenCalledWith(
            'departure',
            'dep1',
            expect.any(Function)
          );

          const callback = (addMovementAssociationListener as jest.Mock).mock.calls[0][2];
          const assocVal = { type: 'arrival', key: 'arr1' };
          callback({ val: () => assocVal });

          expect(channel.put).toHaveBeenCalledWith(
            actions.setAssociatedMovement('departure', 'dep1', assocVal)
          );
        });
      });

      describe('loadMovements error path', () => {
        it('should call channel.put with loadMovementsFailure on error', () => {
          const channel = { put: jest.fn() };
          const action = actions.loadMovements(false);
          const generator = sagas.loadMovements(channel, action);

          expect(generator.next().value).toEqual(select(sagas.stateSelector));

          const error = new Error('load failed');
          generator.throw(error);

          expect(channel.put).toHaveBeenCalledWith(actions.loadMovementsFailure());
        });
      });

      describe('getDefaultValuesFromDeparture with circuits route', () => {
        it('should set arrivalRoute to circuits when departure has circuits route', () => {
          const generator = sagas.getDefaultValuesFromDeparture('departure-key');

          expect(generator.next().value).toEqual(
            call(remote.loadByKey, '/departures', 'departure-key')
          );

          const snapshot = new FakeFirebaseSnapshot('departure-key', {
            immatriculation: 'HBKOF',
            dateTime: '2016-10-09T14:00:00.000Z',
            negativeTimestamp: -1476021600000,
            aircraftType: 'DR40',
            mtow: 1000,
            departureRoute: 'circuits'
          });

          expect(generator.next(snapshot).value).toEqual(
            call(sagas.getArrivalDefaultValues)
          );

          const initialValues = {
            type: 'arrival',
            date: dates.localDate(),
            time: dates.localTimeRounded(15, 'down'),
          };

          const result = generator.next(initialValues);

          expect(result.value.arrivalRoute).toEqual('circuits');
          expect(result.done).toEqual(true);
        });
      });
    });
  });
});
