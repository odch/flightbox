import {call, put, select} from 'redux-saga/effects';
import * as actions from './actions';
import * as sagas from './sagas';

jest.mock('../../util/firebase');
jest.mock('firebase/database', () => ({
  get: jest.fn(),
  query: jest.fn(),
  orderByKey: jest.fn(),
}));

describe('modules', () => {
  describe('aircrafts', () => {
    describe('sagas', () => {
      describe('loadAircrafts', () => {
        it('should skip loading if already loading', () => {
          const generator = sagas.loadAircrafts();

          expect(generator.next().value).toEqual(select(sagas.aircraftsSelector));
          expect(generator.next({ loading: true }).done).toEqual(true);
        });

        it('should load aircrafts if not loading', () => {
          const generator = sagas.loadAircrafts();

          expect(generator.next().value).toEqual(select(sagas.aircraftsSelector));
          expect(generator.next({ loading: false }).value).toEqual(put(actions.setAircraftsLoading()));
          expect(generator.next().value).toEqual(call(sagas.loadAll));

          const snapshot = {};
          expect(generator.next(snapshot).value).toEqual(put(actions.aircraftsLoaded(snapshot)));

          expect(generator.next().done).toEqual(true);
        });
      });
    });
  });
});
