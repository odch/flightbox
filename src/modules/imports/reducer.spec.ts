import reducer from './reducer';
import * as actions from './actions';

const INITIAL_STATE = {};

describe('modules', () => {
  describe('imports', () => {
    describe('reducer', () => {
      it('should handle initial state', () => {
        expect(
          reducer(undefined, {} as any)
        ).toEqual(INITIAL_STATE);
      });

      describe('INIT_IMPORT', () => {
        it('should initialize an import entry', () => {
          expect(
            reducer({}, actions.initImport('aircrafts'))
          ).toEqual({
            aircrafts: {
              file: null,
              inProgress: false,
              done: false,
              failed: false,
            },
          });
        });

        it('should add a new import without affecting existing ones', () => {
          expect(
            reducer({
              aircrafts: {
                file: null,
                inProgress: false,
                done: false,
                failed: false,
              },
            }, actions.initImport('movements'))
          ).toEqual({
            aircrafts: {
              file: null,
              inProgress: false,
              done: false,
              failed: false,
            },
            movements: {
              file: null,
              inProgress: false,
              done: false,
              failed: false,
            },
          });
        });
      });

      describe('SELECT_IMPORT_FILE', () => {
        it('should set the file for the given import', () => {
          const file = { name: 'aircrafts.csv' } as unknown as File;
          expect(
            reducer({
              aircrafts: {
                file: null,
                inProgress: false,
                done: false,
                failed: false,
              },
            }, actions.selectImportFile('aircrafts', file))
          ).toEqual({
            aircrafts: {
              file,
              inProgress: false,
              done: false,
              failed: false,
            },
          });
        });
      });

      describe('SET_IMPORT_IN_PROGRESS', () => {
        it('should set inProgress to true', () => {
          expect(
            reducer({
              aircrafts: {
                file: { name: 'aircrafts.csv' } as unknown as File,
                inProgress: false,
                done: false,
                failed: false,
              },
            }, actions.setImportInProgress('aircrafts', true))
          ).toEqual({
            aircrafts: {
              file: { name: 'aircrafts.csv' },
              inProgress: true,
              done: false,
              failed: false,
            },
          });
        });

        it('should set inProgress to false', () => {
          expect(
            reducer({
              aircrafts: {
                file: { name: 'aircrafts.csv' } as unknown as File,
                inProgress: true,
                done: false,
                failed: false,
              },
            }, actions.setImportInProgress('aircrafts', false))
          ).toEqual({
            aircrafts: {
              file: { name: 'aircrafts.csv' },
              inProgress: false,
              done: false,
              failed: false,
            },
          });
        });
      });

      describe('IMPORT_SUCCESS', () => {
        it('should set done to true and inProgress to false', () => {
          expect(
            reducer({
              aircrafts: {
                file: { name: 'aircrafts.csv' } as unknown as File,
                inProgress: true,
                done: false,
                failed: false,
              },
            }, actions.importSuccess('aircrafts'))
          ).toEqual({
            aircrafts: {
              file: { name: 'aircrafts.csv' },
              inProgress: false,
              done: true,
              failed: false,
            },
          });
        });
      });

      describe('IMPORT_FAILURE', () => {
        it('should set failed to true and inProgress to false', () => {
          expect(
            reducer({
              aircrafts: {
                file: { name: 'aircrafts.csv' } as unknown as File,
                inProgress: true,
                done: false,
                failed: false,
              },
            }, actions.importFailure('aircrafts'))
          ).toEqual({
            aircrafts: {
              file: { name: 'aircrafts.csv' },
              inProgress: false,
              done: false,
              failed: true,
            },
          });
        });
      });
    });
  });
});
