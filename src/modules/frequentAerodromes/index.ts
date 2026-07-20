import { loadFrequentAerodromes } from './actions';
import reducer from './reducer';
import sagas from './sagas';
import { canSeeAllMovements } from '../movements/sagas';
import { frequentAerodromesFrom, MAX_FREQUENT } from '../../util/frequentAerodromes';

/**
 * Personal most-frequent aerodromes (ICAO codes) for the current user.
 *
 * Base list:
 * - Regular users: derived client-side from the already-loaded movements
 *   (`state.movements`), which are bounded to their own `createdBy` — no request.
 * - Admins / `allMovements` operators: taken from the dedicated per-email fetch
 *   (`state.frequentAerodromes`), because their loaded movement list is club-wide.
 *
 * Aerodromes used earlier in this session (recorded on movement save) are merged
 * in first, so a destination just flown to shows up immediately in the next form
 * without waiting for the movement list to reload.
 */
export function selectFrequentAerodromes(state: any): string[] {
  const auth = state.auth.data;

  if ((typeof __CONF__ !== 'undefined' && __CONF__.profileEnabled === false)
    || !auth || auth.guest || auth.kiosk || !auth.email) {
    return [];
  }

  const homeIcao = typeof __CONF__ !== 'undefined' && __CONF__.aerodrome
    ? String(__CONF__.aerodrome.ICAO).toUpperCase()
    : undefined;

  const base = canSeeAllMovements(auth)
    ? state.frequentAerodromes.data
    : frequentAerodromesFrom(state.movements && state.movements.data ? state.movements.data.array : [], auth);

  const session = state.frequentAerodromes.session || [];

  const result: string[] = [];
  const seen = new Set<string>();
  for (const icao of [...session, ...base]) {
    const up = String(icao).toUpperCase();
    if (up === homeIcao || seen.has(up)) {
      continue;
    }
    seen.add(up);
    result.push(up);
    if (result.length >= MAX_FREQUENT) {
      break;
    }
  }
  return result;
}

export { loadFrequentAerodromes };

export { sagas };

export default reducer;
