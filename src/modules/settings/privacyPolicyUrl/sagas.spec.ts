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
    describe('privacyPolicyUrl', () => {
      describe('sagas', () => {
        beforeEach(() => {
          jest.clearAllMocks();
          (firebase as jest.Mock).mockReturnValue({});
        });

        describe('loadPrivacyPolicyUrl', () => {
          it('should register onValue listener', () => {
            const channel = {put: jest.fn()};
            sagas.loadPrivacyPolicyUrl(channel);
            expect(onValue).toHaveBeenCalledWith(expect.anything(), expect.any(Function));
          });

          it('should put privacyPolicyUrlLoaded when firebase value changes', () => {
            const channel = {put: jest.fn()};
            sagas.loadPrivacyPolicyUrl(channel);

            const callback = (onValue as jest.Mock).mock.calls[0][1];
            const url = 'https://example.com/privacy';
            const snapshot = new FakeFirebaseSnapshot('privacyPolicyUrl', url);
            callback(snapshot);

            expect(channel.put).toHaveBeenCalledWith(actions.privacyPolicyUrlLoaded(url));
          });
        });
      });
    });
  });
});
