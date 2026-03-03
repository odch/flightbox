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
    describe('guestAccessToken', () => {
      describe('sagas', () => {
        beforeEach(() => {
          jest.clearAllMocks();
          firebase.mockReturnValue({});
        });

        describe('loadGuestAccessToken', () => {
          it('should register onValue listener', () => {
            const channel = {put: jest.fn()};
            sagas.loadGuestAccessToken(channel);
            expect(onValue).toHaveBeenCalledWith(expect.anything(), expect.any(Function));
          });

          it('should put guestAccessTokenLoaded when firebase value changes', () => {
            const channel = {put: jest.fn()};
            sagas.loadGuestAccessToken(channel);

            const callback = onValue.mock.calls[0][1];
            const token = 'test-token-123';
            const snapshot = new FakeFirebaseSnapshot('guestAccessToken', token);
            callback(snapshot);

            expect(channel.put).toHaveBeenCalledWith(actions.guestAccessTokenLoaded(token));
          });
        });
      });
    });
  });
});
