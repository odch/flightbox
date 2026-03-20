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

        describe('setPrivacyPolicyUrl', () => {
          it('should dispatch saving, save the url, and dispatch success', () => {
            const url = 'https://example.com/privacy';
            const action = actions.setPrivacyPolicyUrl(url);
            const generator = sagas.setPrivacyPolicyUrl(action);

            expect(generator.next().value).toEqual(put(actions.setPrivacyPolicyUrlSaving()));
            expect(generator.next().value).toEqual(call(sagas.savePrivacyPolicyUrl, url));
            expect(generator.next().value).toEqual(put(actions.setPrivacyPolicyUrlSuccess()));
            expect(generator.next().done).toEqual(true);
          });
        });

        describe('savePrivacyPolicyUrl', () => {
          it('calls set with the url', async () => {
            const mockRef = {};
            (firebase as jest.Mock).mockReturnValue(mockRef);
            (set as jest.Mock).mockResolvedValue(undefined);

            await sagas.savePrivacyPolicyUrl('https://example.com/privacy');

            expect(firebase).toHaveBeenCalledWith('/settings/privacyPolicyUrl');
            expect(set).toHaveBeenCalledWith(mockRef, 'https://example.com/privacy');
          });

          it('calls set with null', async () => {
            const mockRef = {};
            (firebase as jest.Mock).mockReturnValue(mockRef);
            (set as jest.Mock).mockResolvedValue(undefined);

            await sagas.savePrivacyPolicyUrl(null);

            expect(set).toHaveBeenCalledWith(mockRef, null);
          });
        });
      });
    });
  });
});
