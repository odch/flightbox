import {call, put, select, take} from 'redux-saga/effects';
import * as actions from './actions';
import * as sagas from './sagas';
import * as remote from './remote';
import FakeFirebaseSnapshot from '../../../../test/FakeFirebaseSnapshot';
import ImmutableItemsArray from "../../../util/ImmutableItemsArray"
import firebase from '../../../util/firebase';
import {onValue} from 'firebase/database';

jest.mock('../../../util/firebase');
jest.mock('firebase/database', () => ({
  onValue: jest.fn(),
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
              name: 'Hans Meier'
            }

            const saveEffect = generator.next(auth).value
            const data = (saveEffect as any).payload.args[0]

            expect(data.status).toEqual('restricted');
            expect(data.details).toEqual('Eine Landung pro Person pro Tag.');
            expect(data.by).toEqual('Hans Meier');
            expect(data.timestamp).toEqual(now.getTime());

            expect(generator.next().value).toEqual(put(actions.saveAerodromeStatusSuccess()));
            expect(generator.next().value).toEqual(call(sagas.loadAerodromeStatus));
            expect(generator.next().done).toEqual(true);
          });

          it('should use uid as by when name is not set', () => {
            const action = actions.saveAerodromeStatus({
              status: 'open',
              details: ''
            });

            const generator = sagas.saveAerodromeStatus(action);

            expect(generator.next().value).toEqual(put(actions.setAerodromeStatusSaving()));
            expect(generator.next().value).toEqual(select(sagas.authSelector));

            const auth = { admin: true, uid: 'user-123' };
            const saveEffect = generator.next(auth).value;
            const data = (saveEffect as any).payload.args[0];

            expect(data.by).toEqual('user-123');
          });

          it('should handle error silently when auth check fails', () => {
            const action = actions.saveAerodromeStatus({ status: 'open', details: '' });
            const generator = sagas.saveAerodromeStatus(action);

            expect(generator.next().value).toEqual(put(actions.setAerodromeStatusSaving()));
            expect(generator.next().value).toEqual(select(sagas.authSelector));

            // auth is null -> will throw
            const result = generator.next(null);
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

        describe('watchCurrentAerodromeStatus', () => {
          beforeEach(() => {
            jest.clearAllMocks();
            (firebase as jest.Mock).mockReturnValue({});
          });

          it('should wait for WATCH_CURRENT_AERODROME_STATUS and then call onValue', () => {
            const channel = { put: jest.fn() };
            const generator = sagas.watchCurrentAerodromeStatus(channel);

            expect(generator.next().value).toEqual(take(actions.WATCH_CURRENT_AERODROME_STATUS));
            expect(generator.next().done).toEqual(true);

            expect(firebase).toHaveBeenCalledWith('/status');
            expect(onValue).toHaveBeenCalledWith(expect.anything(), expect.any(Function));
          });

          it('should call channel.put with status when snapshot has data', () => {
            const channel = { put: jest.fn() };
            const generator = sagas.watchCurrentAerodromeStatus(channel);

            generator.next(); // take
            generator.next(); // onValue call + done

            const callback = (onValue as jest.Mock).mock.calls[0][1];

            const statusItem = { status: 'open', details: '' };
            const snapshot = { val: () => ({ key1: statusItem }) };
            callback(snapshot);

            expect(channel.put).toHaveBeenCalledWith(
              actions.setCurrentAerodromeStatus(statusItem)
            );
          });

          it('should call channel.put with null when snapshot is empty', () => {
            const channel = { put: jest.fn() };
            const generator = sagas.watchCurrentAerodromeStatus(channel);

            generator.next(); // take
            generator.next(); // onValue call + done

            const callback = (onValue as jest.Mock).mock.calls[0][1];

            const nullSnapshot = { val: () => null };
            callback(nullSnapshot);

            expect(channel.put).toHaveBeenCalledWith(
              actions.setCurrentAerodromeStatus(null)
            );
          });
        });
      });
    });
  });
});
