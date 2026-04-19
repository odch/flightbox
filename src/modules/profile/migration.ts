export interface Aircraft {
  immatriculation: string | null;
  aircraftType: string | null;
  mtow: number | null;
  aircraftCategory: string | null;
}

const AIRCRAFT_FIELDS = ['immatriculation', 'aircraftType', 'mtow', 'aircraftCategory'] as const;

export function toAircraftsArray(value: unknown): Aircraft[] | null {
  if (Array.isArray(value)) {
    return value;
  }
  if (value !== null && typeof value === 'object') {
    return Object.values(value as Record<string, Aircraft>);
  }
  return null;
}

export function migrateProfile(profile: Record<string, unknown>): {
  profile: Record<string, unknown>;
  needsMigration: boolean;
} {
  const existing = toAircraftsArray(profile.aircrafts);
  if (existing !== null) {
    if (!Array.isArray(profile.aircrafts)) {
      return { profile: { ...profile, aircrafts: existing }, needsMigration: false };
    }
    return { profile, needsMigration: false };
  }

  const hasFlat = AIRCRAFT_FIELDS.some(
    key => key in profile && profile[key] != null
  );

  if (hasFlat) {
    const aircraft: Aircraft = {
      immatriculation: typeof profile.immatriculation === 'string' ? profile.immatriculation : null,
      aircraftType: typeof profile.aircraftType === 'string' ? profile.aircraftType : null,
      mtow: typeof profile.mtow === 'number' ? profile.mtow : null,
      aircraftCategory: typeof profile.aircraftCategory === 'string' ? profile.aircraftCategory : null,
    };

    const migrated = { ...profile, aircrafts: [aircraft] };
    for (const key of AIRCRAFT_FIELDS) {
      delete migrated[key];
    }

    return { profile: migrated, needsMigration: true };
  }

  return { profile: { ...profile, aircrafts: [] }, needsMigration: false };
}
