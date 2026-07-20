import {all, call, put, select, takeLatest} from 'redux-saga/effects'
import * as actions from './actions';
import * as remote from '../movements/remote';
import {authSelector, canSeeAllMovements} from '../movements/sagas';
import {frequentAerodromesFrom} from '../../util/frequentAerodromes';

const FETCH_LIMIT = 50;

export const stateSelector = (state: any) => state.frequentAerodromes;

function toMovements(result: any): any[] {
  const movements: any[] = [];
  if (result && result.snapshot) {
    result.snapshot.forEach((child: any) => {
      movements.push(child.val());
    });
  }
  return movements;
}

/**
 * Only admins / `allMovements` operators need this fetch: their movement list is
 * club-wide, so their own movements may not be in the loaded window (the "row 51"
 * problem). Regular users already have their own movements in `state.movements`
 * and derive favourites client-side without any request.
 */
export function* loadFrequentAerodromes() {
  try {
    if (typeof __CONF__ !== 'undefined' && __CONF__.profileEnabled === false) {
      return;
    }

    const auth = yield select(authSelector);

    if (!canSeeAllMovements(auth) || !auth.email || auth.guest || auth.kiosk) {
      return;
    }

    const state = yield select(stateSelector);
    if (state.loaded) {
      return;
    }

    const departures = yield call(remote.loadLimited, '/departures', null, FETCH_LIMIT, null, auth.email);
    const arrivals = yield call(remote.loadLimited, '/arrivals', null, FETCH_LIMIT, null, auth.email);

    const movements = toMovements(departures).concat(toMovements(arrivals));
    const data = frequentAerodromesFrom(movements, auth);

    yield put(actions.frequentAerodromesLoaded(data));
  } catch (e) {
    if (console && typeof console.error === 'function') {
      console.error('Failed to load frequent aerodromes', e);
    }
  }
}

export default function* sagas() {
  yield all([
    takeLatest(actions.LOAD_FREQUENT_AERODROMES, loadFrequentAerodromes),
  ])
}
