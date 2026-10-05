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
              fork(watchSettingWhileAdmin, '/settings/customsSelfDeclarationEmails', actions.customsSelfDeclarationEmailsLoaded),
              takeEvery(actions.ADD_CUSTOMS_SELF_DECLARATION_EMAIL, sagas.addEmail),
              takeEvery(actions.REMOVE_CUSTOMS_SELF_DECLARATION_EMAIL, sagas.removeEmail),
            ]));
          });
        });

        describe('withEmail', () => {
          it('appends a new e-mail', () => {
            expect(sagas.withEmail(['a@example.ch'], 'b@example.ch')).toEqual(['a@example.ch', 'b@example.ch']);
          });

          it('ignores an e-mail already in the list', () => {
            expect(sagas.withEmail(['a@example.ch'], 'a@example.ch')).toEqual(['a@example.ch']);
          });
        });

        describe('withoutEmail', () => {
          it('removes the e-mail', () => {
            expect(sagas.withoutEmail(['a@example.ch', 'b@example.ch'], 'a@example.ch')).toEqual(['b@example.ch']);
          });

          it('returns the list unchanged when the e-mail is not in it', () => {
            expect(sagas.withoutEmail(['a@example.ch'], 'b@example.ch')).toEqual(['a@example.ch']);
          });
        });

        describe('addEmail', () => {
          it('normalises the e-mail and adds it', () => {
            const generator = sagas.addEmail(actions.addCustomsSelfDeclarationEmail('  Hans@Example.CH '));

            expect(generator.next().value).toEqual(call(sagas.changeEmailList, sagas.withEmail, 'hans@example.ch'));
            expect(generator.next().done).toEqual(true);
          });

          it('ignores an invalid e-mail', () => {
            const generator = sagas.addEmail(actions.addCustomsSelfDeclarationEmail('not an e-mail'));

            expect(generator.next().done).toEqual(true);
          });
        });

        describe('removeEmail', () => {
          it('removes the e-mail', () => {
            const generator = sagas.removeEmail(actions.removeCustomsSelfDeclarationEmail('hans@example.ch'));

            expect(generator.next().value).toEqual(call(sagas.changeEmailList, sagas.withoutEmail, 'hans@example.ch'));
            expect(generator.next().done).toEqual(true);
          });
        });

        describe('changeEmailList', () => {
          it('should dispatch saving, save the change, and dispatch success', () => {
            const generator = sagas.changeEmailList(sagas.withEmail, 'hans@example.ch');

            expect(generator.next().value).toEqual(put(actions.saveCustomsSelfDeclarationEmailsSaving()));
            expect(generator.next().value).toEqual(call(sagas.saveEmailListChange, sagas.withEmail, 'hans@example.ch'));
            expect(generator.next().value).toEqual(put(actions.saveCustomsSelfDeclarationEmailsSuccess()));
            expect(generator.next().done).toEqual(true);
          });

          it('should log and dispatch failure when saving fails', () => {
            const generator = sagas.changeEmailList(sagas.withEmail, 'hans@example.ch');

            generator.next();
            generator.next();
            const e = new Error('permission_denied');
            expect(generator.throw(e).value).toEqual(put(actions.saveCustomsSelfDeclarationEmailsFailure()));
            expect(error).toHaveBeenCalledWith('Failed to save the customs self-declaration e-mails', e);
            expect(generator.next().done).toEqual(true);
          });
        });

        describe('saveEmailListChange', () => {
          const runUpdate = (current: unknown) => {
            const [, update] = (runTransaction as jest.Mock).mock.calls[0];
            return update(current);
          };

          it('runs a transaction on the list', async () => {
            const mockRef = {};
            (firebase as jest.Mock).mockReturnValue(mockRef);
            (runTransaction as jest.Mock).mockResolvedValue({committed: true});

            await sagas.saveEmailListChange(sagas.withEmail, 'b@example.ch');

            expect(firebase).toHaveBeenCalledWith('/settings/customsSelfDeclarationEmails');
            expect(runTransaction).toHaveBeenCalledWith(mockRef, expect.any(Function));
          });

          it('applies the change to the value in the database', async () => {
            (runTransaction as jest.Mock).mockResolvedValue({committed: true});

            await sagas.saveEmailListChange(sagas.withEmail, 'b@example.ch');

            expect(runUpdate(['a@example.ch'])).toEqual(['a@example.ch', 'b@example.ch']);
            expect(runUpdate(['a@example.ch', 'b@example.ch'])).toEqual(['a@example.ch', 'b@example.ch']);
            expect(runUpdate(null)).toEqual(['b@example.ch']);
          });

          it('normalises the value in the database', async () => {
            (runTransaction as jest.Mock).mockResolvedValue({committed: true});

            await sagas.saveEmailListChange(sagas.withoutEmail, 'b@example.ch');

            expect(runUpdate({0: 'A@example.ch', 2: 'b@example.ch'})).toEqual(['a@example.ch']);
          });

          it('always returns a list so the transaction is not aborted', async () => {
            (runTransaction as jest.Mock).mockResolvedValue({committed: true});

            await sagas.saveEmailListChange(sagas.withoutEmail, 'b@example.ch');

            expect(runUpdate(null)).toEqual([]);
          });
        });
      });
    });
  });
});
