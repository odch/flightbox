import {call, put, select} from 'redux-saga/effects';
import * as actions from './actions';
import * as sagas from './sagas';
import * as remote from '../movements/remote';
import {authSelector} from '../movements/sagas';
import FakeFirebaseSnapshot from '../../../test/FakeFirebaseSnapshot';

jest.mock('../movements/remote');
jest.mock('firebase/database', () => ({
  onChildAdded: jest.fn(() => jest.fn()),
  onChildChanged: jest.fn(() => jest.fn()),
  onChildRemoved: jest.fn(() => jest.fn()),
}));

const admin = {email: 'admin@example.com', admin: true, guest: false, kiosk: false};

const snapshotOf = (movements: any[]) => ({
  snapshot: new FakeFirebaseSnapshot(null, movements.map((m, i) => new FakeFirebaseSnapshot(String(i), m))),
});

describe('modules', () => {
  describe('frequentAerodromes', () => {
    describe('sagas', () => {
      describe('loadFrequentAerodromes', () => {
        beforeEach(() => {
          (global as any).__CONF__ = {aerodrome: {ICAO: 'LSZO'}, profileEnabled: true};
        });

        afterEach(() => {
          delete (global as any).__CONF__;
        });

        it('does nothing for a regular (non-admin) user', () => {
          const generator = sagas.loadFrequentAerodromes();
          expect(generator.next().value).toEqual(select(authSelector));
          expect(generator.next({email: 'pilot@example.com', admin: false}).done).toEqual(true);
        });

        it('does nothing when already loaded', () => {
          const generator = sagas.loadFrequentAerodromes();
          expect(generator.next().value).toEqual(select(authSelector));
          expect(generator.next(admin).value).toEqual(select(sagas.stateSelector));
          expect(generator.next({loaded: true}).done).toEqual(true);
        });

        it('fetches the admin\'s own movements and dispatches the aggregated list', () => {
          const generator = sagas.loadFrequentAerodromes();

          expect(generator.next().value).toEqual(select(authSelector));
          expect(generator.next(admin).value).toEqual(select(sagas.stateSelector));

          expect(generator.next({loaded: false}).value)
            .toEqual(call(remote.loadLimited, '/departures', null, 50, null, admin.email));

          const departures = snapshotOf([
            {location: 'LSGG', createdBy: admin.email},
            {location: 'LSGG', createdBy: admin.email},
          ]);
          expect(generator.next(departures).value)
            .toEqual(call(remote.loadLimited, '/arrivals', null, 50, null, admin.email));

          const arrivals = snapshotOf([
            {location: 'LSZR', createdBy: admin.email},
          ]);
          expect(generator.next(arrivals).value)
            .toEqual(put(actions.frequentAerodromesLoaded(['LSGG', 'LSZR'])));

          expect(generator.next().done).toEqual(true);
        });
      });
    });
  });
});
