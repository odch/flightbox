import {call, put} from 'redux-saga/effects';
import * as actions from './actions';
import * as sagas from './sagas';
import firebase from '../../../util/firebase';
import {onValue, set} from 'firebase/database';
import FakeFirebaseSnapshot from '../../../../test/FakeFirebaseSnapshot';

jest.mock('../../../util/firebase');
jest.mock('firebase/database', () => ({
  onValue: jest.fn(),
  set: jest.fn(),
}));

describe('modules', () => {
  describe('settings', () => {
    describe('aerodromeStatusBannerEnabled', () => {
      describe('sagas', () => {
        beforeEach(() => {
          jest.clearAllMocks();
          (firebase as jest.Mock).mockReturnValue({});
        });

        describe('loadAerodromeStatusBannerEnabled', () => {
          it('should register onValue listener', () => {
            const channel = {put: jest.fn()};
            sagas.loadAerodromeStatusBannerEnabled(channel);
            expect(onValue).toHaveBeenCalledWith(expect.anything(), expect.any(Function));
          });

          it('should put aerodromeStatusBannerEnabledLoaded(true) when value is true', () => {
            const channel = {put: jest.fn()};
            sagas.loadAerodromeStatusBannerEnabled(channel);

            const callback = (onValue as jest.Mock).mock.calls[0][1];
            callback(new FakeFirebaseSnapshot('aerodromeStatusBannerEnabled', true));

            expect(channel.put).toHaveBeenCalledWith(actions.aerodromeStatusBannerEnabledLoaded(true));
          });

          it('should coerce a missing value to false', () => {
            const channel = {put: jest.fn()};
            sagas.loadAerodromeStatusBannerEnabled(channel);

            const callback = (onValue as jest.Mock).mock.calls[0][1];
            callback(new FakeFirebaseSnapshot('aerodromeStatusBannerEnabled', null));

            expect(channel.put).toHaveBeenCalledWith(actions.aerodromeStatusBannerEnabledLoaded(false));
          });
        });

        describe('setAerodromeStatusBannerEnabled', () => {
          it('should dispatch saving, save the value, and dispatch success', () => {
            const action = actions.setAerodromeStatusBannerEnabled(true);
            const generator = sagas.setAerodromeStatusBannerEnabled(action);

            expect(generator.next().value).toEqual(put(actions.setAerodromeStatusBannerEnabledSaving()));
            expect(generator.next().value).toEqual(call(sagas.saveAerodromeStatusBannerEnabled, true));
            expect(generator.next().value).toEqual(put(actions.setAerodromeStatusBannerEnabledSuccess()));
            expect(generator.next().done).toEqual(true);
          });
        });

        describe('saveAerodromeStatusBannerEnabled', () => {
          it('calls set with the value', async () => {
            const mockRef = {};
            (firebase as jest.Mock).mockReturnValue(mockRef);
            (set as jest.Mock).mockResolvedValue(undefined);

            await sagas.saveAerodromeStatusBannerEnabled(true);

            expect(firebase).toHaveBeenCalledWith('/settings/aerodromeStatusBannerEnabled');
            expect(set).toHaveBeenCalledWith(mockRef, true);
          });
        });
      });
    });
  });
});
