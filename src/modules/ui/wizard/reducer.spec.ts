import wizard from './reducer';
import * as actions from './actions';

const INITIAL_STATE = {
  initialized: false,
  page: 1,
  committed: false,
  values: {},
  commitError: null,
  dialogs: {}
};

describe('modules', () => {
  describe('ui', () => {
    describe('wizard', () => {
      describe('reducer', () => {
        it('should handle initial state', () => {
          expect(
            wizard(undefined, {} as any)
          ).toEqual(INITIAL_STATE);
        });

        describe('WIZARD_NEXT_PAGE', () => {
          it('should set next page', () => {
            expect(
              wizard({
                page: 2,
              } as any, actions.nextPage())
            ).toEqual({
              page: 3,
            });
          });
        });

        describe('WIZARD_PREVIOUS_PAGE', () => {
          it('should set previous page', () => {
            expect(
              wizard({
                page: 3,
              } as any, actions.previousPage())
            ).toEqual({
              page: 2,
            });
          });

          it('should stop at first page', () => {
            expect(
              wizard({
                page: 1,
              } as any, actions.previousPage())
            ).toEqual({
              page: 1,
            });
          });
        });

        describe('WIZARD_RESET', () => {
          it('should reset wizard', () => {
            expect(
              wizard({
                page: 3,
              } as any, actions.reset())
            ).toEqual(INITIAL_STATE);
          });
        });

        describe('WIZARD_SHOW_DIALOG', () => {
          it('should show requirements dialog', () => {
            expect(
              wizard({
                dialogs: {
                  'DIALOG1': true
                },
              } as any, actions.showDialog('DIALOG2'))
            ).toEqual({
              dialogs: {
                'DIALOG1': true,
                'DIALOG2': true
              }
            });
          });
        });

        describe('WIZARD_HIDE_DIALOG', () => {
          it('should hide requirements dialog', () => {
            expect(
              wizard({
                dialogs: {
                  'DIALOG1': true,
                  'DIALOG2': true
                }
              } as any, actions.hideDialog('DIALOG2'))
            ).toEqual({
              dialogs: {
                'DIALOG1': true,
                'DIALOG2': false
              }
            });
          });
        });

        describe('WIZARD_SET_COMMITTED', () => {
          it('should reset wizard', () => {
            const key = 'mykey';
            const values = {
              foo: 'bar',
            };

            expect(
              wizard({
                committed: false,
              } as any, actions.setCommitted(key, values))
            ).toEqual({
              committed: true,
              itemKey: key,
              values,
            });
          });
        });

        describe('WIZARD_SET_COMMIT_ERROR', () => {
          it('should set commit error', () => {
            const error = new Error('testerror');
            expect(
              wizard({
                commitError: null,
                showCommitRequirementsDialog: true,
              } as any, actions.setCommitError(error))
            ).toEqual({
              commitError: error,
              showCommitRequirementsDialog: false,
            });
          });
        });

        describe('WIZARD_UNSET_COMMIT_ERROR', () => {
          it('should unset commit error', () => {
            expect(
              wizard({
                commitError: new Error('testerror'),
              } as any, actions.unsetCommitError())
            ).toEqual({
              commitError: null,
            });
          });
        });

        describe('WIZARD_SET_INITIALIZED', () => {
          it('should set values and initialized flag', () => {
            const values = { immatriculation: 'HBABC', type: 'departure' };

            expect(
              wizard({
                initialized: false,
                values: {},
              } as any, actions.setInitialized(values))
            ).toEqual({
              initialized: true,
              values,
            });
          });
        });

        describe('WIZARD_UPDATE_VALUES', () => {
          it('should update values', () => {
            const values = { immatriculation: 'HBABC', type: 'arrival' };

            expect(
              wizard({
                values: { immatriculation: 'HBKOF' },
              } as any, actions.updateValues(values))
            ).toEqual({
              values,
            });
          });
        });
      });
    });
  });
});
