import {call, put, select} from 'redux-saga/effects';
import * as actions from './actions';
import * as sagas from './sagas';
import * as remote from './remote';

jest.mock('./remote');

const mockChangeLanguage = jest.fn();
jest.mock('../../i18n', () => ({
  language: 'de',
  changeLanguage: (...args: any[]) => mockChangeLanguage(...args),
}));

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
          const migratedProfile = { ...profileData, aircrafts: [] };
          const snapshot = { val: () => profileData };
          expect(generator.next(snapshot).value).toEqual(put(actions.profileLoaded(migratedProfile)));

          expect(generator.next().value).toEqual(call(sagas.recordPrivacyPolicyAcceptance, auth, migratedProfile));

          expect(generator.next().done).toEqual(true);
        });

        it('should apply language from profile when it differs from current', () => {
          const generator = sagas.loadProfile();

          expect(generator.next().value).toEqual(select(sagas.authSelector));

          const auth = { uid: 'user-123' };
          expect(generator.next(auth).value).toEqual(call(remote.load, auth.uid));

          const profileData = { firstname: 'Hans', language: 'en' };
          const migratedProfile = { ...profileData, aircrafts: [] };
          const snapshot = { val: () => profileData };
          expect(generator.next(snapshot).value).toEqual(put(actions.profileLoaded(migratedProfile)));

          // Next step should call recordPrivacyPolicyAcceptance (changeLanguage is called inline)
          expect(generator.next().value).toEqual(call(sagas.recordPrivacyPolicyAcceptance, auth, migratedProfile));

          expect(generator.next().done).toEqual(true);
          expect(mockChangeLanguage).toHaveBeenCalledWith('en');
        });

        it('should put profileLoaded with empty object when snapshot.val() returns null', () => {
          const generator = sagas.loadProfile();

          expect(generator.next().value).toEqual(select(sagas.authSelector));

          const auth = { uid: 'user-123' };
          expect(generator.next(auth).value).toEqual(call(remote.load, auth.uid));

          const snapshot = { val: () => null };
          const emptyProfile = { aircrafts: [] };
          expect(generator.next(snapshot).value).toEqual(put(actions.profileLoaded(emptyProfile)));

          expect(generator.next().value).toEqual(call(sagas.recordPrivacyPolicyAcceptance, auth, emptyProfile));

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
      });

      describe('saveLanguage', () => {
        it('should save language to Firebase for regular users', () => {
          const action = actions.saveLanguage('en');
          const generator = sagas.saveLanguage(action);

          expect(generator.next().value).toEqual(select(sagas.authSelector));

          const auth = { uid: 'user-123', guest: false, kiosk: false };
          expect(generator.next(auth).value).toEqual(call(remote.save, 'user-123', { language: 'en' }));

          expect(generator.next().done).toEqual(true);
        });

        it('should not save for guest users', () => {
          const action = actions.saveLanguage('en');
          const generator = sagas.saveLanguage(action);

          expect(generator.next().value).toEqual(select(sagas.authSelector));

          const auth = { uid: 'guest', guest: true, kiosk: false };
          expect(generator.next(auth).done).toEqual(true);
        });

        it('should not save for kiosk users', () => {
          const action = actions.saveLanguage('en');
          const generator = sagas.saveLanguage(action);

          expect(generator.next().value).toEqual(select(sagas.authSelector));

          const auth = { uid: 'kiosk', guest: false, kiosk: true };
          expect(generator.next(auth).done).toEqual(true);
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
      });

      describe('saveProfile', () => {
        it('should save profile and reload it on success', () => {
          const values = {
            memberNr: 'M123',
            email: 'hans@example.com',
            firstname: 'Hans',
            lastname: 'Meier',
            phone: '+41791234567',
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

    describe('loadProfile with migration', () => {
      it('should migrate flat aircraft fields to aircrafts array', () => {
        const generator = sagas.loadProfile();

        expect(generator.next().value).toEqual(select(sagas.authSelector));

        const auth = { uid: 'user-123', guest: false, kiosk: false };
        expect(generator.next(auth).value).toEqual(call(remote.load, auth.uid));

        const profileData = {
          firstname: 'Hans',
          immatriculation: 'HBABC',
          aircraftType: 'C172',
          mtow: 1100,
          aircraftCategory: 'Flugzeug',
        };
        const snapshot = { val: () => profileData };
        const migratedAircrafts = [{
          immatriculation: 'HBABC',
          aircraftType: 'C172',
          mtow: 1100,
          aircraftCategory: 'Flugzeug',
        }];

        // Should call migrateAircrafts since needsMigration is true
        expect(generator.next(snapshot).value).toEqual(
          call(remote.migrateAircrafts, auth.uid, migratedAircrafts)
        );

        const migratedProfile = { firstname: 'Hans', aircrafts: migratedAircrafts };
        expect(generator.next().value).toEqual(put(actions.profileLoaded(migratedProfile)));
      });

      it('should not migrate when aircrafts array already exists', () => {
        const generator = sagas.loadProfile();

        expect(generator.next().value).toEqual(select(sagas.authSelector));

        const auth = { uid: 'user-123' };
        expect(generator.next(auth).value).toEqual(call(remote.load, auth.uid));

        const profileData = {
          firstname: 'Hans',
          aircrafts: [{ immatriculation: 'HBABC', aircraftType: 'C172', mtow: 1100, aircraftCategory: 'Flugzeug' }],
        };
        const snapshot = { val: () => profileData };

        // Should go straight to profileLoaded, no migrateAircrafts call
        expect(generator.next(snapshot).value).toEqual(put(actions.profileLoaded(profileData)));
      });
    });

    describe('addAircraftSaga', () => {
      const aircraft = { immatriculation: 'HBNEW', aircraftType: 'PA28', mtow: 1100, aircraftCategory: 'Flugzeug' };

      it('should add aircraft and reload profile', () => {
        const action = actions.addAircraft(aircraft);
        const generator = sagas.addAircraftSaga(action);

        expect(generator.next().value).toEqual(select(sagas.authSelector));

        const auth = { uid: 'user-123', guest: false, kiosk: false };
        expect(generator.next(auth).value).toEqual(call(remote.load, auth.uid));

        const profile = { aircrafts: [{ immatriculation: 'HBABC', aircraftType: 'C172', mtow: 1100, aircraftCategory: 'Flugzeug' }] };
        const snapshot = { val: () => profile };

        // Should save sorted list
        expect(generator.next(snapshot).value).toEqual(
          call(remote.saveAircraftsList, auth.uid, [
            { immatriculation: 'HBABC', aircraftType: 'C172', mtow: 1100, aircraftCategory: 'Flugzeug' },
            { immatriculation: 'HBNEW', aircraftType: 'PA28', mtow: 1100, aircraftCategory: 'Flugzeug' },
          ])
        );

        expect(generator.next().value).toEqual(call(sagas.loadProfile));
        expect(generator.next().done).toEqual(true);
      });

      it('should skip duplicate immatriculation', () => {
        const dupeAircraft = { immatriculation: 'HBABC', aircraftType: 'PA28', mtow: 900, aircraftCategory: 'Flugzeug' };
        const action = actions.addAircraft(dupeAircraft);
        const generator = sagas.addAircraftSaga(action);

        expect(generator.next().value).toEqual(select(sagas.authSelector));

        const auth = { uid: 'user-123', guest: false, kiosk: false };
        expect(generator.next(auth).value).toEqual(call(remote.load, auth.uid));

        const profile = { aircrafts: [{ immatriculation: 'HBABC', aircraftType: 'C172', mtow: 1100, aircraftCategory: 'Flugzeug' }] };
        const snapshot = { val: () => profile };

        // Should return early — no save, no reload
        expect(generator.next(snapshot).done).toEqual(true);
      });

      it('should add to empty list', () => {
        const action = actions.addAircraft(aircraft);
        const generator = sagas.addAircraftSaga(action);

        expect(generator.next().value).toEqual(select(sagas.authSelector));

        const auth = { uid: 'user-123', guest: false, kiosk: false };
        expect(generator.next(auth).value).toEqual(call(remote.load, auth.uid));

        const snapshot = { val: () => ({}) };

        expect(generator.next(snapshot).value).toEqual(
          call(remote.saveAircraftsList, auth.uid, [aircraft])
        );
      });
    });

    describe('updateAircraftSaga', () => {
      it('should update aircraft at index and reload profile', () => {
        const updated = { immatriculation: 'HBABC', aircraftType: 'C182', mtow: 1400, aircraftCategory: 'Flugzeug' };
        const action = actions.updateAircraft(0, updated);
        const generator = sagas.updateAircraftSaga(action);

        expect(generator.next().value).toEqual(select(sagas.authSelector));

        const auth = { uid: 'user-123', guest: false, kiosk: false };
        expect(generator.next(auth).value).toEqual(call(remote.load, auth.uid));

        const profile = { aircrafts: [
          { immatriculation: 'HBABC', aircraftType: 'C172', mtow: 1100, aircraftCategory: 'Flugzeug' },
          { immatriculation: 'HBXYZ', aircraftType: 'PA28', mtow: 1100, aircraftCategory: 'Flugzeug' },
        ]};
        const snapshot = { val: () => profile };

        expect(generator.next(snapshot).value).toEqual(
          call(remote.saveAircraftsList, auth.uid, [
            { immatriculation: 'HBABC', aircraftType: 'C182', mtow: 1400, aircraftCategory: 'Flugzeug' },
            { immatriculation: 'HBXYZ', aircraftType: 'PA28', mtow: 1100, aircraftCategory: 'Flugzeug' },
          ])
        );

        expect(generator.next().value).toEqual(call(sagas.loadProfile));
        expect(generator.next().done).toEqual(true);
      });

      it('should skip if registration conflicts with another entry', () => {
        const updated = { immatriculation: 'HBXYZ', aircraftType: 'C172', mtow: 1100, aircraftCategory: 'Flugzeug' };
        const action = actions.updateAircraft(0, updated);
        const generator = sagas.updateAircraftSaga(action);

        expect(generator.next().value).toEqual(select(sagas.authSelector));

        const auth = { uid: 'user-123', guest: false, kiosk: false };
        expect(generator.next(auth).value).toEqual(call(remote.load, auth.uid));

        const profile = { aircrafts: [
          { immatriculation: 'HBABC', aircraftType: 'C172', mtow: 1100, aircraftCategory: 'Flugzeug' },
          { immatriculation: 'HBXYZ', aircraftType: 'PA28', mtow: 1100, aircraftCategory: 'Flugzeug' },
        ]};
        const snapshot = { val: () => profile };

        // Duplicate — should return early
        expect(generator.next(snapshot).done).toEqual(true);
      });
    });

    describe('removeAircraftSaga', () => {
      it('should remove aircraft at index and reload profile', () => {
        const action = actions.removeAircraft(1);
        const generator = sagas.removeAircraftSaga(action);

        expect(generator.next().value).toEqual(select(sagas.authSelector));

        const auth = { uid: 'user-123', guest: false, kiosk: false };
        expect(generator.next(auth).value).toEqual(call(remote.load, auth.uid));

        const profile = { aircrafts: [
          { immatriculation: 'HBABC', aircraftType: 'C172', mtow: 1100, aircraftCategory: 'Flugzeug' },
          { immatriculation: 'HBXYZ', aircraftType: 'PA28', mtow: 1100, aircraftCategory: 'Flugzeug' },
        ]};
        const snapshot = { val: () => profile };

        expect(generator.next(snapshot).value).toEqual(
          call(remote.saveAircraftsList, auth.uid, [
            { immatriculation: 'HBABC', aircraftType: 'C172', mtow: 1100, aircraftCategory: 'Flugzeug' },
          ])
        );

        expect(generator.next().value).toEqual(call(sagas.loadProfile));
        expect(generator.next().done).toEqual(true);
      });

      it('should save empty list when removing last aircraft', () => {
        const action = actions.removeAircraft(0);
        const generator = sagas.removeAircraftSaga(action);

        expect(generator.next().value).toEqual(select(sagas.authSelector));

        const auth = { uid: 'user-123', guest: false, kiosk: false };
        expect(generator.next(auth).value).toEqual(call(remote.load, auth.uid));

        const profile = { aircrafts: [
          { immatriculation: 'HBABC', aircraftType: 'C172', mtow: 1100, aircraftCategory: 'Flugzeug' },
        ]};
        const snapshot = { val: () => profile };

        expect(generator.next(snapshot).value).toEqual(
          call(remote.saveAircraftsList, auth.uid, [])
        );
      });

      it('should not save for guest users', () => {
        const action = actions.removeAircraft(0);
        const generator = sagas.removeAircraftSaga(action);

        expect(generator.next().value).toEqual(select(sagas.authSelector));

        const auth = { uid: 'guest', guest: true, kiosk: false };
        // Should throw and be caught — generator ends
        expect(generator.next(auth).done).toEqual(true);
      });
    });
  });
});
