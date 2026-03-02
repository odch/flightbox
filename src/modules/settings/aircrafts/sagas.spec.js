import {all, call, put, take} from 'redux-saga/effects';
import * as actions from './actions';
import * as sagas from './sagas';
import firebase from '../../../util/firebase';

jest.mock('../../../util/firebase');
jest.mock('../../../util/createChannel');

describe('modules', () => {
  describe('settings', () => {
    describe('aircrafts', () => {
      describe('sagas', () => {
        describe('loadByType', () => {
          it('should register firebase listener and complete', () => {
            const channel = {put: jest.fn()};
            const mockRef = {on: jest.fn()};
            firebase.mockReturnValue(mockRef);
            const generator = sagas.loadByType(channel, 'club');
            expect(generator.next().done).toEqual(true);
            expect(mockRef.on).toHaveBeenCalledWith('value', expect.any(Function));
          });

          it('should put loadAircraftSettingsSuccess with snapshot val when callback fires', () => {
            const channel = {put: jest.fn()};
            const mockRef = {on: jest.fn()};
            firebase.mockReturnValue(mockRef);
            const generator = sagas.loadByType(channel, 'homeBase');
            generator.next();

            const callback = mockRef.on.mock.calls[0][1];
            const snapshot = {val: () => ({'HB-KOF': true})};
            callback(snapshot);

            expect(channel.put).toHaveBeenCalledWith(
              actions.loadAircraftSettingsSuccess('homeBase', {'HB-KOF': true})
            );
          });

          it('should put empty object when snapshot val is null', () => {
            const channel = {put: jest.fn()};
            const mockRef = {on: jest.fn()};
            firebase.mockReturnValue(mockRef);
            const generator = sagas.loadByType(channel, 'club');
            generator.next();

            const callback = mockRef.on.mock.calls[0][1];
            callback({val: () => null});

            expect(channel.put).toHaveBeenCalledWith(
              actions.loadAircraftSettingsSuccess('club', {})
            );
          });
        });

        describe('add', () => {
          it('should return a Promise and complete', () => {
            const mockChildRef = {set: jest.fn()};
            const mockRef = {child: jest.fn().mockReturnValue(mockChildRef)};
            firebase.mockReturnValue(mockRef);
            const generator = sagas.add('club', 'HB-KOF');
            const result = generator.next();
            expect(result.done).toEqual(true);
          });

          it('should resolve promise when set succeeds', async () => {
            const mockChildRef = {
              set: jest.fn((val, cb) => cb(null))
            };
            const mockRef = {child: jest.fn().mockReturnValue(mockChildRef)};
            firebase.mockReturnValue(mockRef);
            const generator = sagas.add('club', 'HB-KOF');
            const promise = generator.next().value;
            await expect(promise).resolves.toBeUndefined();
          });

          it('should reject promise when set fails', async () => {
            const error = new Error('permission denied');
            const mockChildRef = {
              set: jest.fn((val, cb) => cb(error))
            };
            const mockRef = {child: jest.fn().mockReturnValue(mockChildRef)};
            firebase.mockReturnValue(mockRef);
            const generator = sagas.add('club', 'HB-KOF');
            const promise = generator.next().value;
            await expect(promise).rejects.toThrow('permission denied');
          });
        });

        describe('remove', () => {
          it('should return a Promise and complete', () => {
            const mockChildRef = {remove: jest.fn()};
            const mockRef = {child: jest.fn().mockReturnValue(mockChildRef)};
            firebase.mockReturnValue(mockRef);
            const generator = sagas.remove('club', 'HB-KOF');
            const result = generator.next();
            expect(result.done).toEqual(true);
          });

          it('should resolve promise when remove succeeds', async () => {
            const mockChildRef = {
              remove: jest.fn(cb => cb(null))
            };
            const mockRef = {child: jest.fn().mockReturnValue(mockChildRef)};
            firebase.mockReturnValue(mockRef);
            const generator = sagas.remove('club', 'HB-KOF');
            const promise = generator.next().value;
            await expect(promise).resolves.toBeUndefined();
          });

          it('should reject promise when remove fails', async () => {
            const error = new Error('remove failed');
            const mockChildRef = {
              remove: jest.fn(cb => cb(error))
            };
            const mockRef = {child: jest.fn().mockReturnValue(mockChildRef)};
            firebase.mockReturnValue(mockRef);
            const generator = sagas.remove('club', 'HB-KOF');
            const promise = generator.next().value;
            await expect(promise).rejects.toThrow('remove failed');
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
