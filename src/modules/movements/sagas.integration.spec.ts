import {runSaga} from 'redux-saga';
import * as sagas from './sagas';
import * as actions from './actions';
import movementsReducer from './reducer';
import * as remote from './remote';
import dates from '../../util/dates';
import {history} from '../../history';

jest.mock('./remote');
jest.mock('firebase/database', () => ({
  onChildAdded: jest.fn(() => jest.fn()),
  onChildChanged: jest.fn(() => jest.fn()),
  onChildRemoved: jest.fn(() => jest.fn()),
}));

/**
 * Integration coverage for the wizard prefill, complementing the effect-level
 * tests in sagas.spec.ts.
 *
 * Those tests step generators by hand and feed each `call` its result, so they
 * verify every saga in isolation but never the composition. That is exactly how
 * the "record departure hangs forever in kiosk mode" bug shipped green: the
 * prefill saga's only test handed it a snapshot, so the rejected read it would
 * hit in production was never exercised.
 *
 * These tests run the real sagas against the real reducer and mock only the
 * Firebase boundary, so the reducer -> selector -> saga seam is covered too.
 */
describe('modules', () => {
  describe('movements', () => {
    describe('wizard prefill (integration)', () => {
      const KIOSK_AUTH = {uid: 'kiosk', kiosk: true, local: true};

      const arrivalValues = {
        type: 'arrival',
        immatriculation: 'HBKOF',
        date: '2016-10-09',
        time: '16:00',
        aircraftType: 'DR40',
        aircraftCategory: 'airplane',
        mtow: 1000,
        memberNr: '34354',
        firstname: 'Max',
        lastname: 'Muster',
        email: 'max@example.com',
        phone: '+41791234567',
        passengerCount: 2,
        location: 'LSZT',
        flightType: 'private',
      };

      const runInitMovement = (
        movementsState: any,
        loadInitialValuesSaga: any = sagas.getDefaultValuesFromArrival,
        key = 'arrival-key'
      ) => {
        const dispatched: any[] = [];
        // Actions dispatched by the saga are fed back through the real reducer,
        // so the store evolves during the run exactly as it does in the app.
        // This is what pins the ordering hazard in initMovement: it dispatches
        // START_INITIALIZE_WIZARD *before* reading the cache, so a reducer that
        // cleared `lastSaved` on that action would silently kill the prefill —
        // with every isolated unit test still green.
        let movements = movementsState;
        return runSaga(
          {
            dispatch: (action: any) => {
              dispatched.push(action);
              movements = movementsReducer(movements, action);
            },
            getState: () => ({movements, auth: {data: KIOSK_AUTH}}),
          },
          sagas.initMovement,
          loadInitialValuesSaga,
          key
        )
          .toPromise()
          .then(() => dispatched);
      };

      const initializedValues = (dispatched: any[]) => {
        const action = dispatched.find(a => a.type === actions.WIZARD_INITIALIZED);
        return action && action.payload.values;
      };

      beforeEach(() => {
        jest.clearAllMocks();
      });

      // The kiosk happy path: the arrival was just recorded, so its values are
      // still in the store and the departure form comes up prefilled — without
      // a read that the movement rules would reject anyway.
      //
      // This also pins the reducer -> selector -> saga seam, because the cached
      // movement here is the reducer's own output rather than a fixture: if
      // `type` or `key` ever stopped surviving into the saved values, the match
      // in loadSourceMovement would stop hitting and the kiosk would quietly
      // fall back to a blank form, with every isolated unit test still green.
      it('should prefill a departure from the arrival the kiosk just recorded', async () => {
        const movementsState = movementsReducer(
          undefined,
          actions.saveMovementSuccess('arrival-key', arrivalValues)
        );

        const dispatched = await runInitMovement(movementsState);

        expect(remote.loadByKey).not.toHaveBeenCalled();

        expect(dispatched.map(a => a.type)).toEqual([
          actions.START_INITIALIZE_WIZARD,
          actions.WIZARD_INITIALIZED,
        ]);

        expect(initializedValues(dispatched)).toEqual({
          type: 'departure',
          date: dates.localDate(),
          time: dates.localTimeRounded(15, 'up'),
          immatriculation: 'HBKOF',
          aircraftType: 'DR40',
          aircraftCategory: 'airplane',
          mtow: 1000,
          memberNr: '34354',
          firstname: 'Max',
          lastname: 'Muster',
          email: 'max@example.com',
          phone: '+41791234567',
          passengerCount: 2,
          location: 'LSZT',
          flightType: 'private',
        });
      });

      // The reported bug. Without a cached movement the read is attempted and
      // the rules reject it; the wizard must still initialize on plain defaults.
      // Both assertions matter: dispatching WIZARD_INITIALIZED is what keeps the
      // pilot off the endless spinner, and not pushing '/' is what keeps them on
      // the form instead of bounced to the start page.
      it('should still initialize the wizard when the arrival cannot be read back', async () => {
        (remote.loadByKey as jest.Mock).mockRejectedValue(new Error('Permission denied'));
        const pushSpy = jest.spyOn(history, 'push').mockImplementation(() => {});

        const movementsState = movementsReducer(undefined, {type: '@@INIT'} as any);

        const dispatched = await runInitMovement(movementsState);

        expect(remote.loadByKey).toHaveBeenCalledWith('/arrivals', 'arrival-key');

        expect(dispatched.map(a => a.type)).toEqual([
          actions.START_INITIALIZE_WIZARD,
          actions.WIZARD_INITIALIZED,
        ]);

        expect(initializedValues(dispatched)).toEqual({
          type: 'departure',
          date: dates.localDate(),
          time: dates.localTimeRounded(15, 'up'),
        });

        expect(pushSpy).not.toHaveBeenCalled();

        pushSpy.mockRestore();
      });

      // The cache is keyed to one movement: a different key must fall through to
      // the read rather than prefilling a departure from the wrong arrival.
      it('should not use the cached movement for a different movement', async () => {
        (remote.loadByKey as jest.Mock).mockResolvedValue({
          val: () => null,
          key: 'arrival-key',
        });

        const movementsState = movementsReducer(
          undefined,
          actions.saveMovementSuccess('a-different-key', arrivalValues)
        );

        const dispatched = await runInitMovement(movementsState);

        expect(remote.loadByKey).toHaveBeenCalledWith('/arrivals', 'arrival-key');
        expect(initializedValues(dispatched)).toEqual({
          type: 'departure',
          date: dates.localDate(),
          time: dates.localTimeRounded(15, 'up'),
        });
      });

      // The mirror direction. Not reachable for kiosk/guest today (they never
      // see the movement list), but it runs the same helper, so pin both.
      it('should prefill an arrival from a departure, and degrade when it cannot be read', async () => {
        const departureValues = {...arrivalValues, type: 'departure', departureRoute: 'circuits'};

        const cached = movementsReducer(
          undefined,
          actions.saveMovementSuccess('departure-key', departureValues)
        );

        const prefilled = await runInitMovement(
          cached,
          sagas.getDefaultValuesFromDeparture,
          'departure-key'
        );

        expect(remote.loadByKey).not.toHaveBeenCalled();
        expect(initializedValues(prefilled)).toMatchObject({
          type: 'arrival',
          immatriculation: 'HBKOF',
          arrivalRoute: 'circuits',
        });

        (remote.loadByKey as jest.Mock).mockRejectedValue(new Error('Permission denied'));

        const degraded = await runInitMovement(
          movementsReducer(undefined, {type: '@@INIT'} as any),
          sagas.getDefaultValuesFromDeparture,
          'departure-key'
        );

        expect(initializedValues(degraded)).toEqual({
          type: 'arrival',
          date: dates.localDate(),
          time: dates.localTimeRounded(15, 'down'),
        });
      });
    });
  });
});
