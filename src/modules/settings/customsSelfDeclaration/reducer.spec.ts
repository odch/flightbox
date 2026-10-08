import reducer from './reducer';
import * as actions from './actions';

const INITIAL_STATE = {
  loaded: false,
  selfDeclarants: [],
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

        describe('CUSTOMS_SELF_DECLARANTS_LOADED', () => {
          it('should set loaded and store the self-declarants', () => {
            expect(
              reducer(INITIAL_STATE, actions.customsSelfDeclarantsLoaded([
                {email: 'a@example.ch', registrations: ['HBKLA']},
                {email: 'b@example.ch'},
              ]))
            ).toEqual({
              ...INITIAL_STATE,
              loaded: true,
              selfDeclarants: [
                {email: 'a@example.ch', registrations: ['HBKLA']},
                {email: 'b@example.ch', registrations: []},
              ],
            });
          });

          it('should treat a missing value as an empty list', () => {
            expect(
              reducer({
                ...INITIAL_STATE,
                loaded: true,
                selfDeclarants: [{email: 'a@example.ch', registrations: []}],
              }, actions.customsSelfDeclarantsLoaded(null))
            ).toEqual({
              ...INITIAL_STATE,
              loaded: true,
              selfDeclarants: [],
            });
          });

          it('should normalise the stored value', () => {
            expect(
              reducer(INITIAL_STATE, actions.customsSelfDeclarantsLoaded({
                0: {email: ' A@Example.ch', registrations: ['hb-kla']},
                2: {email: 'a@example.ch', registrations: ['HB KLB', 'HBKLA']},
                3: 42,
              }))
            ).toEqual({
              ...INITIAL_STATE,
              loaded: true,
              selfDeclarants: [{email: 'a@example.ch', registrations: ['HBKLA', 'HBKLB']}],
            });
          });

          it('should read legacy plain e-mail entries as persons without aircraft', () => {
            expect(
              reducer(INITIAL_STATE, actions.customsSelfDeclarantsLoaded(['a@example.ch', 'B@example.ch']))
            ).toEqual({
              ...INITIAL_STATE,
              loaded: true,
              selfDeclarants: [
                {email: 'a@example.ch', registrations: []},
                {email: 'b@example.ch', registrations: []},
              ],
            });
          });

          it('should keep the saving state', () => {
            expect(
              reducer({
                ...INITIAL_STATE,
                saving: true,
              }, actions.customsSelfDeclarantsLoaded([{email: 'a@example.ch', registrations: ['HBKLA']}]))
            ).toEqual({
              loaded: true,
              selfDeclarants: [{email: 'a@example.ch', registrations: ['HBKLA']}],
              saving: true,
              saveFailed: false,
            });
          });
        });

        describe('SAVE_CUSTOMS_SELF_DECLARANTS_SAVING', () => {
          it('should set saving and reset a previous failure', () => {
            expect(
              reducer({
                ...INITIAL_STATE,
                saveFailed: true,
              }, actions.saveCustomsSelfDeclarantsSaving())
            ).toEqual({
              ...INITIAL_STATE,
              saving: true,
              saveFailed: false,
            });
          });
        });

        describe('SAVE_CUSTOMS_SELF_DECLARANTS_SUCCESS', () => {
          it('should reset saving', () => {
            expect(
              reducer({
                ...INITIAL_STATE,
                saving: true,
              }, actions.saveCustomsSelfDeclarantsSuccess())
            ).toEqual(INITIAL_STATE);
          });
        });

        describe('SAVE_CUSTOMS_SELF_DECLARANTS_FAILURE', () => {
          it('should reset saving and flag the failure', () => {
            expect(
              reducer({
                ...INITIAL_STATE,
                saving: true,
              }, actions.saveCustomsSelfDeclarantsFailure())
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
