import {all, call, fork, put, takeEvery} from 'redux-saga/effects';
import * as actions from './actions';
import * as sagas from './sagas';
import {watchSettingWhileAdmin} from '../watchSettingWhileAdmin';
import firebase from '../../../util/firebase';
import {error} from '../../../util/log';
import {runTransaction} from 'firebase/database';

jest.mock('../../../util/firebase');
jest.mock('../../../util/log', () => ({
  error: jest.fn(),
}));
jest.mock('firebase/database', () => ({
  runTransaction: jest.fn(),
}));

const HANS = {email: 'hans@example.ch', registrations: ['HBKLA']};
const ERIKA = {email: 'erika@example.ch', registrations: []};

describe('modules', () => {
  describe('settings', () => {
    describe('customsSelfDeclaration', () => {
      describe('sagas', () => {
        beforeEach(() => {
          jest.clearAllMocks();
          (firebase as jest.Mock).mockReturnValue({});
        });

        describe('default', () => {
          it('should watch the setting while an admin is signed in and handle changes', () => {
            const generator = sagas.default();
            expect(generator.next().value).toEqual(all([
              fork(watchSettingWhileAdmin, '/settings/customsSelfDeclarationEmails', actions.customsSelfDeclarantsLoaded),
              takeEvery(actions.ADD_CUSTOMS_SELF_DECLARANT, sagas.addSelfDeclarant),
              takeEvery(actions.REMOVE_CUSTOMS_SELF_DECLARANT, sagas.removeSelfDeclarant),
              takeEvery(actions.ADD_CUSTOMS_SELF_DECLARANT_AIRCRAFT, sagas.addAircraft),
              takeEvery(actions.REMOVE_CUSTOMS_SELF_DECLARANT_AIRCRAFT, sagas.removeAircraft),
            ]));
          });
        });

        describe('withSelfDeclarant', () => {
          it('appends a new person without aircraft', () => {
            expect(sagas.withSelfDeclarant([HANS], 'erika@example.ch')).toEqual([HANS, ERIKA]);
          });

          it('keeps a person already in the list (and their aircraft)', () => {
            expect(sagas.withSelfDeclarant([HANS], 'hans@example.ch')).toEqual([HANS]);
          });
        });

        describe('withoutSelfDeclarant', () => {
          it('removes the person', () => {
            expect(sagas.withoutSelfDeclarant([HANS, ERIKA], 'hans@example.ch')).toEqual([ERIKA]);
          });

          it('returns the list unchanged when the person is not in it', () => {
            expect(sagas.withoutSelfDeclarant([HANS], 'erika@example.ch')).toEqual([HANS]);
          });
        });

        describe('withAircraft', () => {
          it('adds the aircraft to the person', () => {
            expect(sagas.withAircraft([HANS, ERIKA], 'erika@example.ch', 'HBKLB')).toEqual([
              HANS,
              {email: 'erika@example.ch', registrations: ['HBKLB']},
            ]);
            expect(sagas.withAircraft([HANS], 'hans@example.ch', 'HBKLB')).toEqual([
              {email: 'hans@example.ch', registrations: ['HBKLA', 'HBKLB']},
            ]);
          });

          it('ignores an aircraft the person already has', () => {
            expect(sagas.withAircraft([HANS], 'hans@example.ch', 'HBKLA')).toEqual([HANS]);
          });

          it('does not add back a person removed in the meantime', () => {
            expect(sagas.withAircraft([HANS], 'erika@example.ch', 'HBKLB')).toEqual([HANS]);
          });
        });

        describe('withoutAircraft', () => {
          it('removes the aircraft from the person only', () => {
            const other = {email: 'other@example.ch', registrations: ['HBKLA']};
            expect(sagas.withoutAircraft([HANS, other], 'hans@example.ch', 'HBKLA')).toEqual([
              {email: 'hans@example.ch', registrations: []},
              other,
            ]);
          });

          it('returns the list unchanged when the person does not have the aircraft', () => {
            expect(sagas.withoutAircraft([HANS], 'hans@example.ch', 'HBKLB')).toEqual([HANS]);
          });
        });

        describe('addSelfDeclarant', () => {
          it('normalises the e-mail and adds the person', () => {
            const generator = sagas.addSelfDeclarant(actions.addCustomsSelfDeclarant('  Hans@Example.CH '));

            expect(generator.next().value).toEqual(call(sagas.changeSelfDeclarants, sagas.withSelfDeclarant, 'hans@example.ch'));
            expect(generator.next().done).toEqual(true);
          });

          it('ignores an invalid e-mail', () => {
            const generator = sagas.addSelfDeclarant(actions.addCustomsSelfDeclarant('not an e-mail'));

            expect(generator.next().done).toEqual(true);
          });
        });

        describe('removeSelfDeclarant', () => {
          it('removes the person', () => {
            const generator = sagas.removeSelfDeclarant(actions.removeCustomsSelfDeclarant('hans@example.ch'));

            expect(generator.next().value).toEqual(call(sagas.changeSelfDeclarants, sagas.withoutSelfDeclarant, 'hans@example.ch'));
            expect(generator.next().done).toEqual(true);
          });
        });

        describe('addAircraft', () => {
          it('normalises the e-mail and the registration and adds the aircraft', () => {
            const generator = sagas.addAircraft(actions.addCustomsSelfDeclarantAircraft(' Hans@Example.CH', 'hb-kla'));

            expect(generator.next().value).toEqual(call(sagas.changeSelfDeclarants, sagas.withAircraft, 'hans@example.ch', 'HBKLA'));
            expect(generator.next().done).toEqual(true);
          });

          it.each(['', ' - ', 'ABCDEFGHIJK'])('ignores the invalid registration %p', registration => {
            const generator = sagas.addAircraft(actions.addCustomsSelfDeclarantAircraft('hans@example.ch', registration));

            expect(generator.next().done).toEqual(true);
          });
        });

        describe('removeAircraft', () => {
          it('normalises the e-mail and the registration and removes the aircraft', () => {
            const generator = sagas.removeAircraft(actions.removeCustomsSelfDeclarantAircraft('Hans@example.ch', 'HB-KLA'));

            expect(generator.next().value).toEqual(call(sagas.changeSelfDeclarants, sagas.withoutAircraft, 'hans@example.ch', 'HBKLA'));
            expect(generator.next().done).toEqual(true);
          });
        });

        describe('changeSelfDeclarants', () => {
          it('should dispatch saving, save the change, and dispatch success', () => {
            const generator = sagas.changeSelfDeclarants(sagas.withAircraft, 'hans@example.ch', 'HBKLA');

            expect(generator.next().value).toEqual(put(actions.saveCustomsSelfDeclarantsSaving()));
            expect(generator.next().value).toEqual(call(sagas.saveSelfDeclarantsChange, sagas.withAircraft, 'hans@example.ch', 'HBKLA'));
            expect(generator.next().value).toEqual(put(actions.saveCustomsSelfDeclarantsSuccess()));
            expect(generator.next().done).toEqual(true);
          });

          it('should log and dispatch failure when saving fails', () => {
            const generator = sagas.changeSelfDeclarants(sagas.withSelfDeclarant, 'hans@example.ch');

            generator.next();
            generator.next();
            const e = new Error('permission_denied');
            expect(generator.throw(e).value).toEqual(put(actions.saveCustomsSelfDeclarantsFailure()));
            expect(error).toHaveBeenCalledWith('Failed to save the customs self-declarants', e);
            expect(generator.next().done).toEqual(true);
          });
        });

        describe('saveSelfDeclarantsChange', () => {
          const runUpdate = (current: unknown) => {
            const [, update] = (runTransaction as jest.Mock).mock.calls[0];
            return update(current);
          };

          beforeEach(() => {
            (runTransaction as jest.Mock).mockResolvedValue({committed: true});
          });

          it('runs a transaction on the list', async () => {
            const mockRef = {};
            (firebase as jest.Mock).mockReturnValue(mockRef);

            await sagas.saveSelfDeclarantsChange(sagas.withSelfDeclarant, 'b@example.ch');

            expect(firebase).toHaveBeenCalledWith('/settings/customsSelfDeclarationEmails');
            expect(runTransaction).toHaveBeenCalledWith(mockRef, expect.any(Function));
          });

          it('applies the change to the value in the database', async () => {
            await sagas.saveSelfDeclarantsChange(sagas.withAircraft, 'a@example.ch', 'HBKLB');

            expect(runUpdate([{email: 'a@example.ch', registrations: ['HBKLA']}])).toEqual([
              {email: 'a@example.ch', registrations: ['HBKLA', 'HBKLB']},
            ]);
            expect(runUpdate([{email: 'a@example.ch'}, {email: 'b@example.ch', registrations: ['HBKLA']}])).toEqual([
              {email: 'a@example.ch', registrations: ['HBKLB']},
              {email: 'b@example.ch', registrations: ['HBKLA']},
            ]);
            expect(runUpdate(null)).toEqual([]);
          });

          it('adds a person to the value in the database', async () => {
            await sagas.saveSelfDeclarantsChange(sagas.withSelfDeclarant, 'b@example.ch');

            expect(runUpdate([{email: 'a@example.ch', registrations: ['HBKLA']}])).toEqual([
              {email: 'a@example.ch', registrations: ['HBKLA']},
              {email: 'b@example.ch', registrations: []},
            ]);
            expect(runUpdate(null)).toEqual([{email: 'b@example.ch', registrations: []}]);
          });

          it('normalises the value in the database and converts legacy entries', async () => {
            await sagas.saveSelfDeclarantsChange(sagas.withoutSelfDeclarant, 'b@example.ch');

            expect(runUpdate({0: 'A@example.ch', 2: 'b@example.ch', 3: {email: 'c@example.ch', registrations: ['hb-kla']}})).toEqual([
              {email: 'a@example.ch', registrations: []},
              {email: 'c@example.ch', registrations: ['HBKLA']},
            ]);
          });

          it('always returns a list so the transaction is not aborted', async () => {
            await sagas.saveSelfDeclarantsChange(sagas.withoutSelfDeclarant, 'b@example.ch');

            expect(runUpdate(null)).toEqual([]);
          });
        });
      });
    });
  });
});
