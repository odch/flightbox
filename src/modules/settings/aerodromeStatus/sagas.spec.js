import {call, put, select} from 'redux-saga/effects';
import * as actions from './actions';
import * as sagas from './sagas';
import * as remote from './remote';
import FakeFirebaseSnapshot from '../../../../test/FakeFirebaseSnapshot';
import ImmutableItemsArray from "../../../util/ImmutableItemsArray"

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
              uid: '30004'
            }

            const saveEffect = generator.next(auth).value
            const data = saveEffect.CALL.args[0]

            expect(data.status).toEqual('restricted');
            expect(data.details).toEqual('Eine Landung pro Person pro Tag.');
            expect(data.by).toEqual('30004');
            expect(data.timestamp).toEqual(now.getTime());

            expect(generator.next().value).toEqual(put(actions.saveAerodromeStatusSuccess()));
            expect(generator.next().value).toEqual(call(sagas.loadAerodromeStatus));
            expect(generator.next().done).toEqual(true);
          });
        });
      });
    });
  });
});
