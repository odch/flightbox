import {all, call, put, take} from 'redux-saga/effects';
import * as actions from './actions';
import * as sagas from './sagas';
import firebase from '../../../util/firebase';
import {onValue, set, remove as fbRemove, child} from 'firebase/database';

jest.mock('../../../util/firebase');
jest.mock('../../../util/createChannel');
jest.mock('firebase/database', () => ({
  onValue: jest.fn(),
  set: jest.fn(),
  remove: jest.fn(),
  child: jest.fn(),
}));

describe('modules', () => {
  describe('settings', () => {
    describe('aircrafts', () => {
      describe('sagas', () => {
        beforeEach(() => {
          jest.clearAllMocks();
          firebase.mockReturnValue({});
        });

        describe('loadByType', () => {
          it('should register onValue listener', () => {
            const channel = {put: jest.fn()};
            sagas.loadByType(channel, 'club');
            expect(onValue).toHaveBeenCalledWith(expect.anything(), expect.any(Function));
            expect(firebase).toHaveBeenCalledWith('/settings/aircrafts/club');
          });

          it('should put loadAircraftSettingsSuccess with snapshot val when callback fires', () => {
            const channel = {put: jest.fn()};
            sagas.loadByType(channel, 'homeBase');

            const callback = onValue.mock.calls[0][1];
            const snapshot = {val: () => ({'HB-KOF': true})};
            callback(snapshot);

            expect(channel.put).toHaveBeenCalledWith(
              actions.loadAircraftSettingsSuccess('homeBase', {'HB-KOF': true})
            );
          });

          it('should put empty object when snapshot val is null', () => {
            const channel = {put: jest.fn()};
            sagas.loadByType(channel, 'club');

            const callback = onValue.mock.calls[0][1];
            callback({val: () => null});

            expect(channel.put).toHaveBeenCalledWith(
              actions.loadAircraftSettingsSuccess('club', {})
            );
          });
        });

        describe('add', () => {
          it('should resolve when set succeeds', async () => {
            const mockRef = {};
            const mockChildRef = {};
            firebase.mockReturnValue(mockRef);
            child.mockReturnValue(mockChildRef);
            set.mockResolvedValue();

            await expect(sagas.add('club', 'HB-KOF')).resolves.toBeUndefined();
            expect(child).toHaveBeenCalledWith(mockRef, 'HB-KOF');
            expect(set).toHaveBeenCalledWith(mockChildRef, true);
          });

          it('should reject when set fails', async () => {
            const mockRef = {};
            const mockChildRef = {};
            firebase.mockReturnValue(mockRef);
            child.mockReturnValue(mockChildRef);
            set.mockRejectedValue(new Error('permission denied'));

            await expect(sagas.add('club', 'HB-KOF')).rejects.toThrow('permission denied');
          });
        });

        describe('remove', () => {
          it('should resolve when remove succeeds', async () => {
            const mockRef = {};
            const mockChildRef = {};
            firebase.mockReturnValue(mockRef);
            child.mockReturnValue(mockChildRef);
            fbRemove.mockResolvedValue();

            await expect(sagas.remove('club', 'HB-KOF')).resolves.toBeUndefined();
            expect(child).toHaveBeenCalledWith(mockRef, 'HB-KOF');
            expect(fbRemove).toHaveBeenCalledWith(mockChildRef);
          });

          it('should reject when remove fails', async () => {
            const mockRef = {};
            const mockChildRef = {};
            firebase.mockReturnValue(mockRef);
            child.mockReturnValue(mockChildRef);
            fbRemove.mockRejectedValue(new Error('remove failed'));

            await expect(sagas.remove('club', 'HB-KOF')).rejects.toThrow('remove failed');
          });
        });

        describe('watchLoadAircrafts', () => {
          it('should wait for load action and then call loadByType for both types', () => {
            const channel = {put: jest.fn()};
            const generator = sagas.watchLoadAircrafts(channel);

            expect(generator.next().value).toEqual(take(actions.LOAD_AIRCRAFT_SETTINGS));

            expect(generator.next().value).toEqual(all([
              call(sagas.loadByType, channel, 'club'),
              call(sagas.loadByType, channel, 'homeBase')
            ]));

            expect(generator.next().done).toEqual(true);
          });
        });

        describe('addAircraft', () => {
          it('should call add and dispatch success when name is provided', () => {
            const action = actions.addAircraft('club', 'HB-KOF');
            const generator = sagas.addAircraft(action);

            expect(generator.next().value).toEqual(call(sagas.add, 'club', 'HB-KOF'));
            expect(generator.next().value).toEqual(put(actions.addAircraftSuccess('club', 'HB-KOF')));
            expect(generator.next().done).toEqual(true);
          });

          it('should do nothing when name is not provided', () => {
            const action = actions.addAircraft('club', '');
            const generator = sagas.addAircraft(action);

            expect(generator.next().done).toEqual(true);
          });
        });

        describe('removeAircraft', () => {
          it('should call remove with type and name', () => {
            const action = actions.removeAircraft('homeBase', 'HB-KOF');
            const generator = sagas.removeAircraft(action);

            expect(generator.next().value).toEqual(call(sagas.remove, 'homeBase', 'HB-KOF'));
            expect(generator.next().done).toEqual(true);
          });
        });
      });
    });
  });
});
