import {call, put, select} from 'redux-saga/effects';
import * as actions from './actions';
import * as sagas from './sagas';
import {loadValue} from '../../util/firebase';

jest.mock('../../util/firebase');

describe('modules', () => {
  describe('aerodromes', () => {
    describe('sagas', () => {
      describe('loadAerodromes', () => {
        it('should skip loading if already loading', () => {
          const generator = sagas.loadAerodromes();

          expect(generator.next().value).toEqual(select(sagas.aerodromesSelector));
          expect(generator.next({ loading: true }).done).toEqual(true);
        });

        it('should load aerodromes if not loading', () => {
          const generator = sagas.loadAerodromes();

          expect(generator.next().value).toEqual(select(sagas.aerodromesSelector));
          expect(generator.next({ loading: false }).value).toEqual(put(actions.setAerodromesLoading()));
          expect(generator.next().value).toEqual(call(loadValue, '/aerodromes'));

          const snapshot = {};
          expect(generator.next(snapshot).value).toEqual(put(actions.aerodromesLoaded(snapshot)));

          expect(generator.next().done).toEqual(true);
        });
      });
    });
  });
});
