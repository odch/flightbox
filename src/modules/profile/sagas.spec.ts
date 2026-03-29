import {call, put, select} from 'redux-saga/effects';
import * as actions from './actions';
import * as sagas from './sagas';
import * as remote from './remote';

jest.mock('./remote');

describe('modules', () => {
  describe('profile', () => {
    describe('sagas', () => {
      describe('loadProfile', () => {
        it('should load profile and put profileLoaded', () => {
          const generator = sagas.loadProfile();

          expect(generator.next().value).toEqual(select(sagas.authSelector));

          const auth = { uid: 'user-123' };
          expect(generator.next(auth).value).toEqual(call(remote.load, auth.uid));

          const profileData = { firstname: 'Hans', lastname: 'Meier' };
          const snapshot = { val: () => profileData };
          expect(generator.next(snapshot).value).toEqual(put(actions.profileLoaded(profileData)));

          expect(generator.next().value).toEqual(call(sagas.recordPrivacyPolicyAcceptance, auth, profileData));

          expect(generator.next().done).toEqual(true);
        });

        it('should put profileLoaded with empty object when snapshot.val() returns null', () => {
          const generator = sagas.loadProfile();

          expect(generator.next().value).toEqual(select(sagas.authSelector));

          const auth = { uid: 'user-123' };
          expect(generator.next(auth).value).toEqual(call(remote.load, auth.uid));

          const snapshot = { val: () => null };
          expect(generator.next(snapshot).value).toEqual(put(actions.profileLoaded({})));

          expect(generator.next().value).toEqual(call(sagas.recordPrivacyPolicyAcceptance, auth, {}));

          expect(generator.next().done).toEqual(true);
        });

        it('should handle error silently', () => {
          const generator = sagas.loadProfile();

          expect(generator.next().value).toEqual(select(sagas.authSelector));

          const error = new Error('Load error');
          expect(generator.throw(error).done).toEqual(true);
        });
      });

      describe('recordPrivacyPolicyAcceptance', () => {
        it('should save privacyPolicyAcceptedAt when not already set and URL is configured', () => {
          const auth = { uid: 'user-123', guest: false, kiosk: false };
          const profile = { firstname: 'Hans' };
          const generator = sagas.recordPrivacyPolicyAcceptance(auth, profile);

          expect(generator.next().value).toEqual(select(sagas.privacyPolicyUrlSelector));

          const result = generator.next('https://example.com/privacy').value;
          expect(result).toEqual(call(remote.save, 'user-123', {
            privacyPolicyAcceptedAt: expect.any(String)
          }));

          expect(generator.next().done).toEqual(true);
        });

        it('should not save when privacyPolicyUrl is not configured', () => {
          const auth = { uid: 'user-123', guest: false, kiosk: false };
          const profile = { firstname: 'Hans' };
          const generator = sagas.recordPrivacyPolicyAcceptance(auth, profile);

          expect(generator.next().value).toEqual(select(sagas.privacyPolicyUrlSelector));

          expect(generator.next(null).done).toEqual(true);
        });

        it('should not save when privacyPolicyAcceptedAt already exists', () => {
          const auth = { uid: 'user-123', guest: false, kiosk: false };
          const profile = { firstname: 'Hans', privacyPolicyAcceptedAt: '2026-01-01T00:00:00.000Z' };
          const generator = sagas.recordPrivacyPolicyAcceptance(auth, profile);

          expect(generator.next().value).toEqual(select(sagas.privacyPolicyUrlSelector));

          expect(generator.next('https://example.com/privacy').done).toEqual(true);
        });

        it('should not save for guest users', () => {
          const auth = { uid: 'guest', guest: true, kiosk: false };
          const profile = {};
          const generator = sagas.recordPrivacyPolicyAcceptance(auth, profile);

          expect(generator.next().done).toEqual(true);
        });

        it('should not save for kiosk users', () => {
          const auth = { uid: 'kiosk', guest: false, kiosk: true };
          const profile = {};
          const generator = sagas.recordPrivacyPolicyAcceptance(auth, profile);

          expect(generator.next().done).toEqual(true);
        });

        it('should not save for ipauth users', () => {
          const auth = { uid: 'ipauth', guest: false, kiosk: false };
          const profile = {};
          const generator = sagas.recordPrivacyPolicyAcceptance(auth, profile);

          expect(generator.next().done).toEqual(true);
        });
      });

      describe('onAuthentication', () => {
        it('should call loadProfile for personal login', () => {
          const action = {
            payload: { authData: { uid: 'user-123', guest: false, kiosk: false } }
          };
          const generator = sagas.onAuthentication(action);

          expect(generator.next().value).toEqual(call(sagas.loadProfile));
          expect(generator.next().done).toEqual(true);
        });

        it('should not call loadProfile for guest users', () => {
          const action = {
            payload: { authData: { uid: 'guest', guest: true, kiosk: false } }
          };
          const generator = sagas.onAuthentication(action);

          expect(generator.next().done).toEqual(true);
        });

        it('should not call loadProfile for kiosk users', () => {
          const action = {
            payload: { authData: { uid: 'kiosk', guest: false, kiosk: true } }
          };
          const generator = sagas.onAuthentication(action);

          expect(generator.next().done).toEqual(true);
        });

        it('should not call loadProfile when authData is null (logout)', () => {
          const action = {
            payload: { authData: null }
          };
          const generator = sagas.onAuthentication(action);

          expect(generator.next().done).toEqual(true);
        });

        it('should not call loadProfile for ipauth users', () => {
          const action = {
            payload: { authData: { local: true } }
          };
          const generator = sagas.onAuthentication(action);

          expect(generator.next().done).toEqual(true);
        });
      });

      describe('saveProfile', () => {
        it('should save profile and reload it on success', () => {
          const values = {
            memberNr: 'M123',
            email: 'hans@example.com',
            firstname: 'Hans',
            lastname: 'Meier',
            phone: '+41791234567',
            immatriculation: 'HBABC',
            aircraftCategory: 'Motorflugzeug',
            aircraftType: 'C172',
            mtow: 1000
          };
          const action = actions.saveProfile(values);
          const generator = sagas.saveProfile(action);

          expect(generator.next().value).toEqual(select(sagas.authSelector));

          const auth = { uid: 'user-123', guest: false, kiosk: false };
          const valuesToSave = {
            memberNr: 'M123',
            email: 'hans@example.com',
            firstname: 'Hans',
            lastname: 'Meier',
            phone: '+41791234567',
            immatriculation: 'HBABC',
            aircraftCategory: 'Motorflugzeug',
            aircraftType: 'C172',
            mtow: 1000
          };
          expect(generator.next(auth).value).toEqual(call(remote.save, auth.uid, valuesToSave));

          expect(generator.next().value).toEqual(call(sagas.loadProfile));

          expect(generator.next().value).toEqual(put(actions.saveProfileSuccess()));

          expect(generator.next().done).toEqual(true);
        });

        it('should convert empty string values to null using str()', () => {
          const values = {
            memberNr: '',
            email: null,
            firstname: 'Hans',
            lastname: 'Meier',
            phone: null,
            immatriculation: null,
            aircraftCategory: null,
            aircraftType: null,
            mtow: 'notanumber'
          };
          const action = actions.saveProfile(values);
          const generator = sagas.saveProfile(action);

          expect(generator.next().value).toEqual(select(sagas.authSelector));

          const auth = { uid: 'user-456', guest: false, kiosk: false };
          const valuesToSave = {
            memberNr: null,
            email: null,
            firstname: 'Hans',
            lastname: 'Meier',
            phone: null,
            immatriculation: null,
            aircraftCategory: null,
            aircraftType: null,
            mtow: null
          };
          expect(generator.next(auth).value).toEqual(call(remote.save, auth.uid, valuesToSave));

          expect(generator.next().value).toEqual(call(sagas.loadProfile));
          expect(generator.next().value).toEqual(put(actions.saveProfileSuccess()));
          expect(generator.next().done).toEqual(true);
        });

        it('should put saveProfileFailure when user is a guest', () => {
          const values = { memberNr: 'M123' };
          const action = actions.saveProfile(values);
          const generator = sagas.saveProfile(action);

          expect(generator.next().value).toEqual(select(sagas.authSelector));

          const auth = { uid: 'user-789', guest: true, kiosk: false };
          expect(generator.next(auth).value).toEqual(put(actions.saveProfileFailure()));

          expect(generator.next().done).toEqual(true);
        });

        it('should put saveProfileFailure when user is a kiosk user', () => {
          const values = { memberNr: 'M123' };
          const action = actions.saveProfile(values);
          const generator = sagas.saveProfile(action);

          expect(generator.next().value).toEqual(select(sagas.authSelector));

          const auth = { uid: 'user-789', guest: false, kiosk: true };
          expect(generator.next(auth).value).toEqual(put(actions.saveProfileFailure()));

          expect(generator.next().done).toEqual(true);
        });

        it('should put saveProfileFailure when uid is ipauth', () => {
          const values = { memberNr: 'M123' };
          const action = actions.saveProfile(values);
          const generator = sagas.saveProfile(action);

          expect(generator.next().value).toEqual(select(sagas.authSelector));

          const auth = { uid: 'ipauth', guest: false, kiosk: false };
          expect(generator.next(auth).value).toEqual(put(actions.saveProfileFailure()));

          expect(generator.next().done).toEqual(true);
        });

        it('should put saveProfileFailure on error', () => {
          const values = { memberNr: 'M123' };
          const action = actions.saveProfile(values);
          const generator = sagas.saveProfile(action);

          expect(generator.next().value).toEqual(select(sagas.authSelector));

          const error = new Error('Save error');
          expect(generator.throw(error).value).toEqual(put(actions.saveProfileFailure()));

          expect(generator.next().done).toEqual(true);
        });
      });
    });
  });
});
