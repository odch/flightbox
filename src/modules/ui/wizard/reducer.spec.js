import wizard from './reducer';
import * as actions from './actions';

const INITIAL_STATE = {
  initialized: false,
  page: 1,
  committed: false,
  values: null,
  commitError: null,
  dialogs: {}
};

describe('modules', () => {
  describe('ui', () => {
    describe('wizard', () => {
      describe('reducer', () => {
        it('should handle initial state', () => {
          expect(
            wizard(undefined, {})
          ).toEqual(INITIAL_STATE);
        });

        describe('WIZARD_NEXT_PAGE', () => {
          it('should set next page', () => {
            expect(
              wizard({
                page: 2,
              }, actions.nextPage())
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
              }, actions.previousPage())
            ).toEqual({
              page: 2,
            });
          });

          it('should stop at first page', () => {
            expect(
              wizard({
                page: 1,
              }, actions.previousPage())
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
              }, actions.reset())
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
              }, actions.showDialog('DIALOG2'))
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
              }, actions.hideDialog('DIALOG2'))
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
              }, actions.setCommitted(key, values))
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
              }, actions.setCommitError(error))
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
              }, actions.unsetCommitError())
            ).toEqual({
              commitError: null,
            });
          });
        });
      });
    });
  });
});
