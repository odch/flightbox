import { migrateProfile, toAircraftsArray } from './migration';

describe('migrateProfile', () => {
  it('returns profile unchanged when aircrafts array already exists', () => {
    const profile = {
      firstname: 'Hans',
      aircrafts: [{ immatriculation: 'HB-ABC', aircraftType: 'C172', mtow: 1100, aircraftCategory: 'single-engine' }],
    };
    const result = migrateProfile(profile);
    expect(result.needsMigration).toBe(false);
    expect(result.profile).toBe(profile);
  });

  it('migrates flat aircraft fields into aircrafts array', () => {
    const profile = {
      firstname: 'Hans',
      immatriculation: 'HB-ABC',
      aircraftType: 'C172',
      mtow: 1100,
      aircraftCategory: 'single-engine',
    };
    const result = migrateProfile(profile);
    expect(result.needsMigration).toBe(true);
    expect(result.profile.aircrafts).toEqual([{
      immatriculation: 'HB-ABC',
      aircraftType: 'C172',
      mtow: 1100,
      aircraftCategory: 'single-engine',
    }]);
    expect(result.profile.immatriculation).toBeUndefined();
    expect(result.profile.aircraftType).toBeUndefined();
    expect(result.profile.mtow).toBeUndefined();
    expect(result.profile.aircraftCategory).toBeUndefined();
    expect(result.profile.firstname).toBe('Hans');
  });

  it('migrates partial flat fields (only immatriculation)', () => {
    const profile = { immatriculation: 'HB-XYZ' };
    const result = migrateProfile(profile);
    expect(result.needsMigration).toBe(true);
    expect(result.profile.aircrafts).toEqual([{
      immatriculation: 'HB-XYZ',
      aircraftType: null,
      mtow: null,
      aircraftCategory: null,
    }]);
  });

  it('sets empty aircrafts array when no aircraft data exists', () => {
    const profile = { firstname: 'Hans', lastname: 'Meier' };
    const result = migrateProfile(profile);
    expect(result.needsMigration).toBe(false);
    expect(result.profile.aircrafts).toEqual([]);
  });

  it('sets empty aircrafts array for empty profile', () => {
    const result = migrateProfile({});
    expect(result.needsMigration).toBe(false);
    expect(result.profile.aircrafts).toEqual([]);
  });

  it('does not migrate when flat fields are all null', () => {
    const profile = {
      firstname: 'Hans',
      immatriculation: null,
      aircraftType: null,
      mtow: null,
      aircraftCategory: null,
    };
    const result = migrateProfile(profile);
    expect(result.needsMigration).toBe(false);
    expect(result.profile.aircrafts).toEqual([]);
  });

  it('preserves existing aircrafts array even if empty', () => {
    const profile = { firstname: 'Hans', aircrafts: [] };
    const result = migrateProfile(profile);
    expect(result.needsMigration).toBe(false);
    expect(result.profile.aircrafts).toEqual([]);
  });

  it('handles Firebase object format (non-array) for aircrafts', () => {
    const profile = {
      firstname: 'Hans',
      aircrafts: {
        '0': { immatriculation: 'HB-ABC', aircraftType: 'C172', mtow: 1100, aircraftCategory: 'Flugzeug' },
        '1': { immatriculation: 'HB-XYZ', aircraftType: 'PA28', mtow: 1100, aircraftCategory: 'Flugzeug' },
      },
    };
    const result = migrateProfile(profile);
    expect(result.needsMigration).toBe(false);
    expect(result.profile.aircrafts).toEqual([
      { immatriculation: 'HB-ABC', aircraftType: 'C172', mtow: 1100, aircraftCategory: 'Flugzeug' },
      { immatriculation: 'HB-XYZ', aircraftType: 'PA28', mtow: 1100, aircraftCategory: 'Flugzeug' },
    ]);
  });

  it('handles sparse Firebase object for aircrafts', () => {
    const profile = {
      aircrafts: {
        '0': { immatriculation: 'HB-ABC', aircraftType: 'C172', mtow: 1100, aircraftCategory: 'Flugzeug' },
        '2': { immatriculation: 'HB-XYZ', aircraftType: 'PA28', mtow: 1100, aircraftCategory: 'Flugzeug' },
      },
    };
    const result = migrateProfile(profile);
    expect(result.needsMigration).toBe(false);
    expect(Array.isArray(result.profile.aircrafts)).toBe(true);
    expect((result.profile.aircrafts as any[]).length).toBe(2);
  });
});

describe('toAircraftsArray', () => {
  it('returns array as-is', () => {
    const arr = [{ immatriculation: 'HB-ABC', aircraftType: null, mtow: null, aircraftCategory: null }];
    expect(toAircraftsArray(arr)).toBe(arr);
  });

  it('converts Firebase object to array', () => {
    const obj = { '0': { immatriculation: 'HB-ABC' }, '1': { immatriculation: 'HB-XYZ' } };
    expect(toAircraftsArray(obj)).toEqual([{ immatriculation: 'HB-ABC' }, { immatriculation: 'HB-XYZ' }]);
  });

  it('returns null for null', () => {
    expect(toAircraftsArray(null)).toBe(null);
  });

  it('returns null for undefined', () => {
    expect(toAircraftsArray(undefined)).toBe(null);
  });

  it('returns null for non-object primitives', () => {
    expect(toAircraftsArray('string')).toBe(null);
    expect(toAircraftsArray(42)).toBe(null);
    expect(toAircraftsArray(true)).toBe(null);
  });

  it('returns empty array for empty object', () => {
    expect(toAircraftsArray({})).toEqual([]);
  });

  it('returns empty array for empty array', () => {
    expect(toAircraftsArray([])).toEqual([]);
  });
});
