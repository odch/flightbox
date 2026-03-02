import {call, put, select} from 'redux-saga/effects';
import * as actions from './actions';
import * as sagas from './sagas';
import importUsers from '../../util/importUsers';

jest.mock('../../util/importUsers');
jest.mock('../../util/log');

describe('modules', () => {
  describe('imports', () => {
    describe('sagas', () => {
      describe('selectImport', () => {
        it('should return a selector for the given import name', () => {
          const selector = sagas.selectImport('users');
          const state = {
            imports: {
              users: { file: null, inProgress: false }
            }
          };
          expect(selector(state)).toEqual({ file: null, inProgress: false });
        });
      });

      describe('doImport', () => {
        it('should call importUsers for users import', () => {
          const csvString = 'name,email\nJohn,john@example.com';
          sagas.doImport('users', csvString);
          expect(importUsers).toHaveBeenCalledWith(csvString);
        });

        it('should throw for unknown import name', () => {
          expect(() => sagas.doImport('unknown', 'csv')).toThrow('Unknown import unknown');
        });
      });

      describe('getString', () => {
        it('should resolve with file contents as string', async () => {
          const fileContent = 'name,email\nJohn,john@example.com';
          const file = new Blob([fileContent], {type: 'text/csv'});

          const result = await sagas.getString(file);
          expect(result).toBe(fileContent);
        });
      });

      describe('importSaga', () => {
        it('should run the success path', () => {
          const action = actions.startImport('users');
          const generator = sagas.importSaga(action);

          expect(generator.next().value).toEqual(put(actions.setImportInProgress('users', true)));

          // selectImport returns a new closure each call, so we verify the
          // select effect's selector works correctly by calling it on test state
          const selectStep = generator.next();
          const selectEffect = selectStep.value;
          const testState = { imports: { users: { file: null } } };
          expect(selectEffect.payload.selector(testState)).toEqual(testState.imports.users);

          const state = { file: new File([''], 'test.csv') };
          expect(generator.next(state).value).toEqual(call(sagas.getString, state.file));

          const csvString = 'name,email\nJohn,john@example.com';
          expect(generator.next(csvString).value).toEqual(call(sagas.doImport, 'users', csvString));

          expect(generator.next().value).toEqual(put(actions.importSuccess('users')));

          expect(generator.next().done).toEqual(true);
        });

        it('should put importFailure on error', () => {
          const action = actions.startImport('users');
          const generator = sagas.importSaga(action);

          expect(generator.next().value).toEqual(put(actions.setImportInProgress('users', true)));

          // Advance past the select step
          generator.next();

          const state = { file: new File([''], 'test.csv') };
          expect(generator.next(state).value).toEqual(call(sagas.getString, state.file));

          const error = new Error('File read error');
          expect(generator.throw(error).value).toEqual(put(actions.importFailure('users')));

          expect(generator.next().done).toEqual(true);
        });
      });
    });
  });
});
