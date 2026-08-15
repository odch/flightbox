import {call, put, select, delay} from 'redux-saga/effects';
import * as actions from './actions';
import * as sagas from './sagas';
import * as remote from './remote';
import FakeFirebaseSnapshot from '../../../../test/FakeFirebaseSnapshot';
import ImmutableItemsArray from "../../../util/ImmutableItemsArray"

jest.mock('../../../util/firebase');
jest.mock('firebase/database', () => ({
  get: jest.fn(),
  push: jest.fn(),
  query: jest.fn(r => r),
  orderByChild: jest.fn(),
  limitToLast: jest.fn(),
}));

describe('modules', () => {
  describe('settings', () => {
    describe('aerodromeStatus', () => {
      describe('sagas', () => {
        describe('loadAerodromeStatus', () => {
          it('should load status', () => {
            const generator = sagas.loadAerodromeStatus();

            expect(generator.next().value).toEqual(put(actions.aerodromeStatusLoading()));
            expect(generator.next().value).toEqual(call(remote.loadLatest));

            const snapshot = new FakeFirebaseSnapshot('status', [new FakeFirebaseSnapshot('status1', {
              status: 'open',
              details: '',
              timestamp: new Date('2020-03-15T10:00:00.000Z').getTime(),
              by: '23524'
            }), new FakeFirebaseSnapshot('status2', {
              status: 'restricted',
              details: 'Eine Landung pro Pilot pro Tag.',
              timestamp: new Date('2020-03-17T11:15:00.000Z').getTime(),
              by: '10424'
            })]);

            expect(generator.next(snapshot).value).toEqual(put(actions.aerodromeStatusLoaded({
              status: 'restricted',
              details: 'Eine Landung pro Pilot pro Tag.'
            }, new ImmutableItemsArray([{
              key: 'status2',
              status: 'restricted',
              details: 'Eine Landung pro Pilot pro Tag.',
              timestamp: 1584443700000,
              by: '10424'
            }, {
              key: 'status1',
              status: 'open',
              details: '',
              timestamp: 1584266400000,
              by: '23524'
            }]))));

            expect(generator.next().done).toEqual(true);
          });
        });

        describe('saveAerodromeStatus', () => {
          afterEach(() => {
            jest.restoreAllMocks();
          });

          it('should save status', () => {
            const now = new Date('2020-03-29T11:00:00.000Z')
            jest.spyOn(global, 'Date').mockImplementationOnce(() => now);

            const action = actions.saveAerodromeStatus({
              status: 'restricted',
              details: 'Eine Landung pro Person pro Tag.'
            })

            const generator = sagas.saveAerodromeStatus(action);

            expect(generator.next().value).toEqual(put(actions.setAerodromeStatusSaving()));
            expect(generator.next().value).toEqual(select(sagas.authSelector));

            const auth = {
              admin: true,
              uid: '30004',
              name: 'Hans Meier',
              email: 'hans@example.ch'
            }

            expect(generator.next(auth).value).toEqual(select(sagas.profileSelector));

            const profile = { firstname: 'Hans', lastname: 'Meier' };

            const saveEffect = generator.next(profile).value
            const data = (saveEffect as any).payload.args[0]

            expect(data.status).toEqual('restricted');
            expect(data.details).toEqual('Eine Landung pro Person pro Tag.');
            expect(data.by).toEqual('Hans Meier');
            expect(data.uid).toEqual('30004');
            expect(data.firstname).toEqual('Hans');
            expect(data.lastname).toEqual('Meier');
            expect(data.email).toEqual('hans@example.ch');
            expect(data.timestamp).toEqual(now.getTime());

            expect(generator.next().value).toEqual(put(actions.saveAerodromeStatusSuccess()));
            expect(generator.next().value).toEqual(call(sagas.loadAerodromeStatus));
            expect(generator.next().done).toEqual(true);
          });

          it('should use uid as by when name is not set and persist null profile fields', () => {
            const action = actions.saveAerodromeStatus({
              status: 'open',
              details: ''
            });

            const generator = sagas.saveAerodromeStatus(action);

            expect(generator.next().value).toEqual(put(actions.setAerodromeStatusSaving()));
            expect(generator.next().value).toEqual(select(sagas.authSelector));

            const auth = { admin: true, uid: 'user-123' };
            expect(generator.next(auth).value).toEqual(select(sagas.profileSelector));

            const saveEffect = generator.next({}).value;
            const data = (saveEffect as any).payload.args[0];

            expect(data.by).toEqual('user-123');
            expect(data.uid).toEqual('user-123');
            expect(data.firstname).toBeNull();
            expect(data.lastname).toBeNull();
            expect(data.email).toBeNull();
          });

          it('should handle error silently when auth check fails', () => {
            const action = actions.saveAerodromeStatus({ status: 'open', details: '' });
            const generator = sagas.saveAerodromeStatus(action);

            expect(generator.next().value).toEqual(put(actions.setAerodromeStatusSaving()));
            expect(generator.next().value).toEqual(select(sagas.authSelector));

            // After auth select, saga continues with profile select before the admin check.
            expect(generator.next(null).value).toEqual(select(sagas.profileSelector));

            // Profile resolved -> admin check throws because auth is null.
            const result = generator.next({});
            expect(result.done).toEqual(true);
          });
        });

        describe('loadAerodromeStatus error path', () => {
          it('should handle error silently', () => {
            const generator = sagas.loadAerodromeStatus();

            expect(generator.next().value).toEqual(put(actions.aerodromeStatusLoading()));

            const error = new Error('load failed');
            const result = generator.throw(error);
            expect(result.done).toEqual(true);
          });

          it('should handle empty status list', () => {
            const generator = sagas.loadAerodromeStatus();

            expect(generator.next().value).toEqual(put(actions.aerodromeStatusLoading()));
            expect(generator.next().value).toEqual(call(remote.loadLatest));

            const emptySnapshot = new FakeFirebaseSnapshot('status', []);

            expect(generator.next(emptySnapshot).value).toEqual(
              put(actions.aerodromeStatusLoaded({
                status: null,
                details: ''
              }, new ImmutableItemsArray([])))
            );

            expect(generator.next().done).toEqual(true);
          });
        });

        describe('mapCurrentStatus', () => {
          it('maps the API response to the widget shape', () => {
            expect(sagas.mapCurrentStatus({
              status: 'restricted',
              message: 'Eine Landung pro Pilot pro Tag.',
              last_update_date: '2020-03-17T11:15:00.000Z',
            })).toEqual({
              status: 'restricted',
              details: 'Eine Landung pro Pilot pro Tag.',
              timestamp: new Date('2020-03-17T11:15:00.000Z').getTime(),
            });
          });

          it('returns null when there is no current status', () => {
            expect(sagas.mapCurrentStatus({})).toBeNull();
            expect(sagas.mapCurrentStatus(null)).toBeNull();
          });
        });

        describe('pollCurrentAerodromeStatus', () => {
          it('fetches the status API, dispatches the mapped status, then delays', () => {
            const generator = sagas.pollCurrentAerodromeStatus();

            expect(generator.next().value).toEqual(call(remote.fetchCurrentStatus));

            const response = {
              status: 'restricted',
              message: 'Eine Landung pro Pilot pro Tag.',
              last_update_date: '2020-03-17T11:15:00.000Z',
            };

            expect(generator.next(response).value).toEqual(
              put(actions.setCurrentAerodromeStatus({
                status: 'restricted',
                details: 'Eine Landung pro Pilot pro Tag.',
                timestamp: new Date('2020-03-17T11:15:00.000Z').getTime(),
              }))
            );

            expect(generator.next().value).toEqual(delay(sagas.POLL_INTERVAL_MS));
          });

          it('dispatches null when the API returns no current status', () => {
            const generator = sagas.pollCurrentAerodromeStatus();

            expect(generator.next().value).toEqual(call(remote.fetchCurrentStatus));
            expect(generator.next({}).value).toEqual(
              put(actions.setCurrentAerodromeStatus(null))
            );
            expect(generator.next().value).toEqual(delay(sagas.POLL_INTERVAL_MS));
          });

          it('keeps polling after a fetch error', () => {
            const generator = sagas.pollCurrentAerodromeStatus();

            expect(generator.next().value).toEqual(call(remote.fetchCurrentStatus));
            // The thrown fetch error is caught; the saga still delays and loops.
            expect(generator.throw(new Error('network')).value)
              .toEqual(delay(sagas.POLL_INTERVAL_MS));
          });
        });
      });
    });
  });
});
