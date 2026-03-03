import * as actions from './actions';
import * as sagas from './sagas';
import firebase from '../../../util/firebase';
import {onValue} from 'firebase/database';
import FakeFirebaseSnapshot from '../../../../test/FakeFirebaseSnapshot';

jest.mock('../../../util/firebase');
jest.mock('firebase/database', () => ({
  onValue: jest.fn(),
}));

describe('modules', () => {
  describe('settings', () => {
    describe('kioskAccessToken', () => {
      describe('sagas', () => {
        beforeEach(() => {
          jest.clearAllMocks();
          firebase.mockReturnValue({});
        });

        describe('loadKioskAccessToken', () => {
          it('should register onValue listener', () => {
            const channel = {put: jest.fn()};
            sagas.loadKioskAccessToken(channel);
            expect(onValue).toHaveBeenCalledWith(expect.anything(), expect.any(Function));
          });

          it('should put kioskAccessTokenLoaded when firebase value changes', () => {
            const channel = {put: jest.fn()};
            sagas.loadKioskAccessToken(channel);

            const callback = onValue.mock.calls[0][1];
            const token = 'kiosk-token-456';
            const snapshot = new FakeFirebaseSnapshot('kioskAccessToken', token);
            callback(snapshot);

            expect(channel.put).toHaveBeenCalledWith(actions.kioskAccessTokenLoaded(token));
          });
        });
      });
    });
  });
});
