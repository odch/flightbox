export const MAX_FREQUENT = 5;

interface FrequencyAuth {
  email?: string | null;
  guest?: boolean;
  kiosk?: boolean;
}

interface FrequencyMovement {
  location?: string | null;
  createdBy?: string | null;
}

/**
 * Derives a pilot's most-frequent aerodromes (ICAO codes) from a list of
 * movements, keyed on the movement's `createdBy` (the user's email).
 *
 * Both departures (destinations) and arrivals (origins) may be passed in;
 * combined they describe the pilot's full aerodrome repertoire. The home
 * aerodrome (`__CONF__.aerodrome.ICAO`) is excluded — it is a local flight, not a
 * destination, and is surfaced separately as a pinned quick-pick.
 *
 * Returns the top {@link MAX_FREQUENT} ICAO codes, most-frequent first, or an empty
 * list when the feature does not apply (guest/kiosk, no email, or profile disabled).
 */
export function frequentAerodromesFrom(
  movements: FrequencyMovement[] | null | undefined,
  auth: FrequencyAuth | null | undefined
): string[] {
  if (typeof __CONF__ !== 'undefined' && __CONF__.profileEnabled === false) {
    return [];
  }

  if (!auth || auth.guest || auth.kiosk || !auth.email) {
    return [];
  }

  if (!Array.isArray(movements) || movements.length === 0) {
    return [];
  }

  const homeIcao = typeof __CONF__ !== 'undefined' && __CONF__.aerodrome
    ? String(__CONF__.aerodrome.ICAO).toUpperCase()
    : undefined;

  const counts = new Map<string, number>();

  for (const movement of movements) {
    if (!movement || movement.createdBy !== auth.email || !movement.location) {
      continue;
    }
    const icao = String(movement.location).toUpperCase();
    if (icao === homeIcao) {
      continue;
    }
    counts.set(icao, (counts.get(icao) || 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, MAX_FREQUENT)
    .map(([icao]) => icao);
}
