'use strict';

let capturedOnRun;

jest.mock('firebase-functions', () => ({
  pubsub: {
    schedule: jest.fn(() => ({
      timeZone: jest.fn(() => ({
        onRun: jest.fn(handler => {
          capturedOnRun = handler;
        })
      }))
    }))
  },
  config: jest.fn(() => ({ rtdb: { instance: 'test-instance' } })),
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    log: jest.fn()
  }
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

jest.mock('node-fetch');
const fetch = require('node-fetch');

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
