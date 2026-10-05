import reducer from './reducer';
import * as actions from './actions';

const INITIAL_STATE = {
  statuses: {},
};

describe('modules', () => {
  describe('settings', () => {
    describe('customsSyncStatus', () => {
      describe('reducer', () => {
        it('should handle initial state', () => {
          expect(
            reducer(undefined, {} as any)
          ).toEqual(INITIAL_STATE);
        });

        describe('CUSTOMS_SYNC_STATUS_LOADED', () => {
          it('should store the statuses', () => {
            const statuses = {
              selfDeclarationEmails: {status: 'ok', timestamp: '2026-10-05T12:00:00.000Z', rejected: ['x']},
              invoiceRecipients: {status: 'error', timestamp: '2026-10-05T13:00:00.000Z', httpStatus: 401},
            };
            expect(
              reducer(INITIAL_STATE, actions.customsSyncStatusLoaded(statuses))
            ).toEqual({
              statuses,
            });
          });

          it('should reset the statuses when there are none', () => {
            expect(
              reducer({
                statuses: {
                  invoiceRecipients: {status: 'ok', timestamp: '2026-10-05T12:00:00.000Z'},
                },
              }, actions.customsSyncStatusLoaded(null))
            ).toEqual(INITIAL_STATE);
          });

          it('should ignore a value that is not an object', () => {
            expect(
              reducer(INITIAL_STATE, actions.customsSyncStatusLoaded('ok'))
            ).toEqual(INITIAL_STATE);
          });
        });
      });
    });
  });
});
