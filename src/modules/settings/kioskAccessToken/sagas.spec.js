import * as actions from './actions';
import * as sagas from './sagas';
import firebase from '../../../util/firebase';
import FakeFirebaseSnapshot from '../../../../test/FakeFirebaseSnapshot';

jest.mock('../../../util/firebase');

describe('modules', () => {
  describe('settings', () => {
    describe('kioskAccessToken', () => {
      describe('sagas', () => {
        describe('loadKioskAccessToken', () => {
          it('should register firebase listener and complete', () => {
            const channel = {put: jest.fn()};
            const mockRef = {on: jest.fn()};
            firebase.mockReturnValue(mockRef);

            const generator = sagas.loadKioskAccessToken(channel);
            expect(generator.next().done).toEqual(true);

            expect(mockRef.on).toHaveBeenCalledWith('value', expect.any(Function));
          });

          it('should put kioskAccessTokenLoaded when firebase value changes', () => {
            const channel = {put: jest.fn()};
            const mockRef = {on: jest.fn()};
            firebase.mockReturnValue(mockRef);

            const generator = sagas.loadKioskAccessToken(channel);
            generator.next();

            const callback = mockRef.on.mock.calls[0][1];
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
