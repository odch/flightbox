import {call, put, select} from 'redux-saga/effects';
import * as actions from './actions';
import * as sagas from './sagas';

jest.mock('../../util/firebase');

describe('modules', () => {
  describe('users', () => {
    describe('sagas', () => {
      describe('loadUsers', () => {
        it('should skip loading if already loading', () => {
          const generator = sagas.loadUsers();

          expect(generator.next().value).toEqual(select(sagas.usersSelector));
          expect(generator.next({loading: true}).done).toEqual(true);
        });

        it('should load users if not loading', () => {
          const generator = sagas.loadUsers();

          expect(generator.next().value).toEqual(select(sagas.usersSelector));
          expect(generator.next({loading: false}).value).toEqual(put(actions.setUsersLoading()));
          expect(generator.next().value).toEqual(call(sagas.loadAll));

          const snapshot = {};
          expect(generator.next(snapshot).value).toEqual(put(actions.usersLoaded(snapshot)));

          expect(generator.next().done).toEqual(true);
        });
      });
    });
  });
});
