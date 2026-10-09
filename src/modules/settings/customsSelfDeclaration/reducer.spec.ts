import reducer from './reducer';
import * as actions from './actions';

const INITIAL_STATE = {
  loaded: false,
  emails: [],
  saving: false,
  saveFailed: false,
};

describe('modules', () => {
  describe('settings', () => {
    describe('customsSelfDeclaration', () => {
      describe('reducer', () => {
        it('should handle initial state', () => {
          expect(
            reducer(undefined, {} as any)
          ).toEqual(INITIAL_STATE);
        });

        describe('CUSTOMS_SELF_DECLARATION_EMAILS_LOADED', () => {
          it('should set loaded and store the e-mails', () => {
            expect(
              reducer(INITIAL_STATE, actions.customsSelfDeclarationEmailsLoaded(['a@example.ch', 'b@example.ch']))
            ).toEqual({
              ...INITIAL_STATE,
              loaded: true,
              emails: ['a@example.ch', 'b@example.ch'],
            });
          });

          it('should treat a missing value as an empty list', () => {
            expect(
              reducer({
                ...INITIAL_STATE,
                loaded: true,
                emails: ['a@example.ch'],
              }, actions.customsSelfDeclarationEmailsLoaded(null))
            ).toEqual({
              ...INITIAL_STATE,
              loaded: true,
              emails: [],
            });
          });

          it('should normalise the stored value', () => {
            expect(
              reducer(INITIAL_STATE, actions.customsSelfDeclarationEmailsLoaded({0: ' A@Example.ch', 2: 'a@example.ch', 3: 42}))
            ).toEqual({
              ...INITIAL_STATE,
              loaded: true,
              emails: ['a@example.ch'],
            });
          });

          it('should keep the saving state', () => {
            expect(
              reducer({
                ...INITIAL_STATE,
                saving: true,
              }, actions.customsSelfDeclarationEmailsLoaded(['a@example.ch']))
            ).toEqual({
              loaded: true,
              emails: ['a@example.ch'],
              saving: true,
              saveFailed: false,
            });
          });
        });

        describe('SAVE_CUSTOMS_SELF_DECLARATION_EMAILS_SAVING', () => {
          it('should set saving and reset a previous failure', () => {
            expect(
              reducer({
                ...INITIAL_STATE,
                saveFailed: true,
              }, actions.saveCustomsSelfDeclarationEmailsSaving())
            ).toEqual({
              ...INITIAL_STATE,
              saving: true,
              saveFailed: false,
            });
          });
        });

        describe('SAVE_CUSTOMS_SELF_DECLARATION_EMAILS_SUCCESS', () => {
          it('should reset saving', () => {
            expect(
              reducer({
                ...INITIAL_STATE,
                saving: true,
              }, actions.saveCustomsSelfDeclarationEmailsSuccess())
            ).toEqual(INITIAL_STATE);
          });
        });

        describe('SAVE_CUSTOMS_SELF_DECLARATION_EMAILS_FAILURE', () => {
          it('should reset saving and flag the failure', () => {
            expect(
              reducer({
                ...INITIAL_STATE,
                saving: true,
              }, actions.saveCustomsSelfDeclarationEmailsFailure())
            ).toEqual({
              ...INITIAL_STATE,
              saving: false,
              saveFailed: true,
            });
          });
        });
      });
    });
  });
});
