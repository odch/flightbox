'use strict';

let capturedOnRun;

jest.mock('firebase-functions/v2/scheduler', () => ({
  onSchedule: jest.fn((opts, handler) => {
    capturedOnRun = handler;
  })
}));

const mockUpdate = jest.fn();
const mockRef = jest.fn();

jest.mock('firebase-admin', () => ({
  database: Object.assign(
    jest.fn(() => ({ ref: mockRef })),
    {
      ServerValue: { TIMESTAMP: 'SERVER_TIMESTAMP' }
    }
  )
}));

const fetch = jest.fn();
global.fetch = fetch;

require('./updateAerodromes');

describe('functions/updateAerodromes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const setupMocks = (aerodromes, existingKeys = {}, enabled = true) => {
    const enabledSnapshot = { val: () => enabled };
    const existingSnapshot = { val: () => existingKeys };

    mockRef.mockImplementation(path => {
      if (path === 'settings/updateAerodromesCronJobEnabled') {
        return { once: jest.fn().mockResolvedValue(enabledSnapshot) };
      }
      if (path === 'aerodromes') {
        return {
          once: jest.fn().mockResolvedValue(existingSnapshot),
          update: mockUpdate.mockResolvedValue()
        };
      }
      return { once: jest.fn(), update: mockUpdate };
    });

    fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ aerodromes })
    });
  };

  describe('processAerodromeUpdates', () => {
    it('includes European country aerodromes', async () => {
      setupMocks([
        { icao: 'LSZH', name: 'Zurich', country: 'CH', timezone: 'Europe/Zurich' }
      ]);

      await capturedOnRun();

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          LSZH: expect.objectContaining({
            name: 'ZURICH',
            country: 'CH',
            timezone: 'Europe/Zurich',
            lastUpdated: 'SERVER_TIMESTAMP'
          })
        })
      );
    });

    it('uppercases aerodrome name', async () => {
      setupMocks([
        { icao: 'LFPG', name: 'Paris Charles de Gaulle', country: 'FR', timezone: 'Europe/Paris' }
      ]);

      await capturedOnRun();

      const updateArg = mockUpdate.mock.calls[0][0];
      expect(updateArg['LFPG'].name).toBe('PARIS CHARLES DE GAULLE');
    });

    it('excludes non-European country aerodromes', async () => {
      setupMocks([
        { icao: 'KJFK', name: 'New York JFK', country: 'US', timezone: 'America/New_York' },
        { icao: 'LSZH', name: 'Zurich', country: 'CH', timezone: 'Europe/Zurich' }
      ]);

      await capturedOnRun();

      const updateArg = mockUpdate.mock.calls[0][0];
      expect(updateArg['KJFK']).toBeUndefined();
      expect(updateArg['LSZH']).toBeDefined();
    });

    it('handles all supported European country codes', async () => {
      const europeanCountries = [
        'CH', 'DE', 'FR', 'AT', 'IT', 'GB', 'ES', 'NL', 'BE', 'PL'
      ];

      setupMocks(
        europeanCountries.map((country, i) => ({
          icao: `LSZ${i}`,
          name: `Airport ${i}`,
          country,
          timezone: 'Europe/Zurich'
        }))
      );

      await capturedOnRun();

      const updateArg = mockUpdate.mock.calls[0][0];
      expect(Object.keys(updateArg)).toHaveLength(europeanCountries.length);
    });

    it('returns empty updates for empty aerodromes list', async () => {
      setupMocks([]);

      await capturedOnRun();

      // No update should be called since no entries
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  describe('getAerodromesToRemove', () => {
    it('marks aerodromes for removal that are not in import', async () => {
      setupMocks(
        [{ icao: 'LSZH', name: 'Zurich', country: 'CH', timezone: 'Europe/Zurich' }],
        { LSZH: {}, LSZT: {} } // LSZT exists but not in import
      );

      await capturedOnRun();

      const updateArg = mockUpdate.mock.calls[0][0];
      expect(updateArg['LSZT']).toBeNull();
      expect(updateArg['LSZH']).not.toBeNull();
    });

    it('does not remove aerodromes still present in import', async () => {
      setupMocks(
        [{ icao: 'LSZH', name: 'Zurich', country: 'CH', timezone: 'Europe/Zurich' }],
        { LSZH: {} }
      );

      await capturedOnRun();

      const updateArg = mockUpdate.mock.calls[0][0];
      expect(updateArg['LSZH']).not.toBeNull();
    });
  });

  describe('delete-all / poisoned-feed guard', () => {
    const makeAerodrome = i => ({
      icao: `LS${i.toString().padStart(2, '0')}`,
      name: `Airport ${i}`,
      country: 'CH',
      timezone: 'Europe/Zurich'
    });

    const keysFor = count => {
      const obj = {};
      for (let i = 0; i < count; i++) {
        obj[`LS${i.toString().padStart(2, '0')}`] = {};
      }
      return obj;
    };

    it('skips the sync when the feed is empty but the table is populated', async () => {
      setupMocks([], { LSZH: {}, LSZT: {} });

      await capturedOnRun();

      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('refuses to remove more than 10% of a populated table', async () => {
      // 100 existing, feed only re-supplies 80 → 20 removals (20%) → aborts
      const imported = Array.from({ length: 80 }, (_, i) => makeAerodrome(i));
      setupMocks(imported, keysFor(100));

      await capturedOnRun();

      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('allows removals within the 10% safety limit on a large table', async () => {
      // 100 existing, feed re-supplies 95 → 5 removals (5%) → proceeds
      const imported = Array.from({ length: 95 }, (_, i) => makeAerodrome(i));
      setupMocks(imported, keysFor(100));

      await capturedOnRun();

      expect(mockUpdate).toHaveBeenCalledTimes(1);
      const updateArg = mockUpdate.mock.calls[0][0];
      const removed = Object.keys(updateArg).filter(k => updateArg[k] === null);
      expect(removed).toHaveLength(5);
    });

    it('ignores malformed entries missing icao or name', async () => {
      setupMocks([
        { icao: 'LSZH', name: 'Zurich', country: 'CH', timezone: 'Europe/Zurich' },
        { icao: 'LSZB', country: 'CH', timezone: 'Europe/Zurich' }, // no name
        { name: 'No ICAO', country: 'CH', timezone: 'Europe/Zurich' } // no icao
      ]);

      await capturedOnRun();

      const updateArg = mockUpdate.mock.calls[0][0];
      expect(updateArg['LSZH']).toBeDefined();
      expect(updateArg['LSZB']).toBeUndefined();
    });
  });

  describe('cron job disabled', () => {
    it('returns early when settings flag is false', async () => {
      setupMocks([], {}, false);

      await capturedOnRun();

      expect(fetch).not.toHaveBeenCalled();
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('returns early when settings flag is null', async () => {
      const nullSnapshot = { val: () => null };
      mockRef.mockReturnValue({
        once: jest.fn().mockResolvedValue(nullSnapshot)
      });

      await capturedOnRun();

      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe('fetch error handling', () => {
    it('throws when fetch response is not ok', async () => {
      const enabledSnapshot = { val: () => true };
      mockRef.mockReturnValue({
        once: jest.fn().mockResolvedValue(enabledSnapshot)
      });

      fetch.mockResolvedValue({
        ok: false,
        statusText: 'Internal Server Error'
      });

      await expect(capturedOnRun()).rejects.toThrow('Failed to fetch aerodromes: Internal Server Error');
    });

    it('handles missing aerodromes array in response (defaults to empty)', async () => {
      const enabledSnapshot = { val: () => true };
      const existingSnapshot = { val: () => ({}) };

      mockRef.mockImplementation(path => {
        if (path === 'settings/updateAerodromesCronJobEnabled') {
          return { once: jest.fn().mockResolvedValue(enabledSnapshot) };
        }
        return {
          once: jest.fn().mockResolvedValue(existingSnapshot),
          update: mockUpdate
        };
      });

      fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({}) // no aerodromes key
      });

      await capturedOnRun();

      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });
});
