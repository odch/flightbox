'use strict';

let capturedOnRun;

jest.mock('firebase-functions', () => ({
  region: jest.fn(() => ({
    pubsub: {
      schedule: jest.fn(() => ({
        timeZone: jest.fn(() => ({
          onRun: jest.fn(handler => {
            capturedOnRun = handler;
          })
        }))
      }))
    }
  })),
  config: jest.fn(() => ({ rtdb: { instance: 'test-instance' } })),
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    log: jest.fn()
  }
}));

const mockUpdate = jest.fn();
const mockPush = jest.fn();
const mockOnce = jest.fn();
const mockRef = jest.fn();
const mockChild = jest.fn();

jest.mock('firebase-admin', () => ({
  database: Object.assign(
    jest.fn(() => ({
      ref: mockRef
    })),
    {
      ServerValue: { TIMESTAMP: 'SERVER_TIMESTAMP' }
    }
  )
}));

jest.mock('node-fetch');
const fetch = require('node-fetch');

// Load module after mocks are set up - this triggers onRun registration
require('./updateAircraftList');

describe('functions/updateAircraftList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('processAircraftUpdates (pure logic, category mapping)', () => {
    // Test the aircraft category mapping logic by calling the scheduled handler
    // with controlled inputs via the firebase mock

    const aircraftCategoryMap = {
      'Aeroplane': 'Flugzeug',
      'Homebuilt Airplane': 'Eigenbauflugzeug',
      'Powered Glider': 'Motorsegler',
      'Helicopter': 'Hubschrauber',
      'Homebuilt Helicopter': 'Eigenbauhubschrauber',
      'Glider': 'Segelflugzeug',
      'Homebuild Glider': 'Eigenbausegelflugzeug',
      'Balloon (Hot-air)': 'Ballon (Heissluft)',
      'Balloon (Gas)': 'Ballon (Gas)',
      'Airship (Hot-air)': 'Luftschiff (Heissluft)',
      'Ultralight Gyrocopter': 'Ultraleicht Tragschrauber',
      'Ultralight (3-axis control)': 'Ultraleichtflugzeug (3-Achsen gesteuert)',
      'Trike': 'Trike',
      'Ecolight': 'Ecolight',
      'Homebuilt Gyrocopter': 'Eigenbautragschrauber'
    };

    const runHandlerWithAircraft = async (aircraftList, existingKeys = {}) => {
      // settings enabled
      const enabledSnapshot = { val: () => true };
      // aircraft list snapshot from db
      const existingSnapshot = { val: () => existingKeys };

      mockRef.mockImplementation(path => {
        if (path === 'settings/updateAircraftListCronJobEnabled') {
          return { once: jest.fn().mockResolvedValue(enabledSnapshot) };
        }
        if (path === 'aircrafts') {
          return {
            once: jest.fn().mockResolvedValue(existingSnapshot),
            update: mockUpdate.mockResolvedValue()
          };
        }
        return { once: jest.fn(), update: mockUpdate };
      });

      fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ aircraft: aircraftList })
      });

      await capturedOnRun();
    };

    it('processes Aeroplane with hyphen-stripped registration', async () => {
      await runHandlerWithAircraft([
        { registration: 'HB-KOF', aircraft_type: 'Aeroplane', mtom: 750, icao_aircraft_type: 'C172' }
      ]);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          HBKOF: expect.objectContaining({ category: 'Flugzeug', mtow: 750, type: 'C172' })
        })
      );
    });

    it('skips aircraft with unknown category', async () => {
      await runHandlerWithAircraft([
        { registration: 'HB-XYZ', aircraft_type: 'FlyingCar', mtom: 500, icao_aircraft_type: 'UNKN' }
      ]);

      // No update should be called since no valid aircraft
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('marks stale registrations for deletion (null) when not in import', async () => {
      await runHandlerWithAircraft(
        [
          { registration: 'HB-NEW', aircraft_type: 'Aeroplane', mtom: 600, icao_aircraft_type: 'C172' }
        ],
        { HBOLD: { category: 'Flugzeug' } } // existing aircraft not in new list
      );

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ HBOLD: null })
      );
    });

    it('handles all known aircraft types', async () => {
      const knownTypes = Object.keys(aircraftCategoryMap);
      const list = knownTypes.map((aircraft_type, i) => ({
        registration: `HB-A${i.toString().padStart(2, '0')}`,
        aircraft_type,
        mtom: 500,
        icao_aircraft_type: 'TEST'
      }));

      await runHandlerWithAircraft(list);

      expect(mockUpdate).toHaveBeenCalledTimes(1);
      const updateArg = mockUpdate.mock.calls[0][0];
      expect(Object.keys(updateArg)).toHaveLength(knownTypes.length);
    });

    it('does nothing when cron job is disabled', async () => {
      const disabledSnapshot = { val: () => false };
      mockRef.mockReturnValue({
        once: jest.fn().mockResolvedValue(disabledSnapshot)
      });

      fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ aircraft: [] })
      });

      await capturedOnRun();

      expect(fetch).not.toHaveBeenCalled();
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('throws and propagates error when fetch fails', async () => {
      const enabledSnapshot = { val: () => true };
      mockRef.mockReturnValue({
        once: jest.fn().mockResolvedValue(enabledSnapshot)
      });

      fetch.mockResolvedValue({
        ok: false,
        statusText: 'Service Unavailable'
      });

      await expect(capturedOnRun()).rejects.toThrow('Failed to fetch aircraft list: Service Unavailable');
    });

    it('handles aircraft data with missing aircraft array (defaults to empty)', async () => {
      const enabledSnapshot = { val: () => true };
      const existingSnapshot = { val: () => ({}) };

      mockRef.mockImplementation(path => {
        if (path === 'settings/updateAircraftListCronJobEnabled') {
          return { once: jest.fn().mockResolvedValue(enabledSnapshot) };
        }
        return {
          once: jest.fn().mockResolvedValue(existingSnapshot),
          update: mockUpdate
        };
      });

      fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({}) // no aircraft key
      });

      // Should not throw - falls back to empty array
      await capturedOnRun();
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  describe('getAircraftItemsToRemove (via handler behavior)', () => {
    it('keeps existing aircraft that are still in the imported list', async () => {
      const enabledSnapshot = { val: () => true };
      const existingSnapshot = { val: () => ({ HBKOF: { category: 'Flugzeug' } }) };

      mockRef.mockImplementation(path => {
        if (path === 'settings/updateAircraftListCronJobEnabled') {
          return { once: jest.fn().mockResolvedValue(enabledSnapshot) };
        }
        if (path === 'aircrafts') {
          return {
            once: jest.fn().mockResolvedValue(existingSnapshot),
            update: mockUpdate.mockResolvedValue()
          };
        }
        return { once: jest.fn(), update: mockUpdate };
      });

      fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          aircraft: [
            { registration: 'HB-KOF', aircraft_type: 'Aeroplane', mtom: 750, icao_aircraft_type: 'C172' }
          ]
        })
      });

      await capturedOnRun();

      const updateArg = mockUpdate.mock.calls[0][0];
      // HBKOF should be updated, not set to null
      expect(updateArg['HBKOF']).not.toBeNull();
      expect(updateArg['HBKOF']).toBeDefined();
    });
  });
});
