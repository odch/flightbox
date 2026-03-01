'use strict';

let capturedOnRun;

jest.mock('firebase-functions', () => ({
  runWith: jest.fn(() => ({
    pubsub: {
      schedule: jest.fn(() => ({
        onRun: jest.fn(handler => {
          capturedOnRun = handler;
        })
      }))
    }
  })),
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    log: jest.fn()
  }
}));

const mockOnce = jest.fn();
const mockRef = jest.fn();

jest.mock('firebase-admin', () => ({
  database: jest.fn(() => ({ ref: mockRef }))
}));

// Mock utils used by the cron job
jest.mock('./utils', () => ({
  loadAircraftMovements: jest.fn(),
  isHomeBase: jest.fn(),
  getAssociatedMovement: jest.fn(),
  setAssociatedMovement: jest.fn(),
  addWithType: jest.fn(
    (movements, type) => snapshot => {
      const data = snapshot.val();
      data.key = snapshot.ref.key;
      data.type = type;
      movements.push(data);
    }
  ),
  compareDescending: jest.fn((a, b) => {
    if (a.dateTime < b.dateTime) return 1;
    if (a.dateTime > b.dateTime) return -1;
    return 0;
  })
}));

const utils = require('./utils');

require('./setAssociatedMovementsCronJob');

describe('functions/associatedMovements/setAssociatedMovementsCronJob', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const buildSnapshot = (movements) => {
    const children = movements.map(m => ({
      ref: { key: m.key },
      val: () => m
    }));

    return {
      numChildren: () => movements.length,
      forEach: jest.fn(cb => children.forEach(cb))
    };
  };

  const setupDb = ({ enabled, departures = [], arrivals = [], associations = [] }) => {
    const enabledSnapshot = { val: () => enabled };
    const departuresSnapshot = buildSnapshot(departures);
    const arrivalsSnapshot = buildSnapshot(arrivals);
    const associationsSnapshot = buildSnapshot(associations);

    mockRef.mockImplementation(path => {
      if (path === '/settings/setAssociatedMovementsCronJobEnabled') {
        return { once: jest.fn().mockResolvedValue(enabledSnapshot) };
      }
      if (path === '/departures') {
        return { once: jest.fn().mockResolvedValue(departuresSnapshot) };
      }
      if (path === '/arrivals') {
        return { once: jest.fn().mockResolvedValue(arrivalsSnapshot) };
      }
      if (path === '/movementAssociations/departures') {
        return { once: jest.fn().mockResolvedValue(associationsSnapshot) };
      }
      if (path === '/movementAssociations/arrivals') {
        return { once: jest.fn().mockResolvedValue(associationsSnapshot) };
      }
      return { once: jest.fn().mockResolvedValue({ val: () => null }) };
    });
  };

  describe('when cron job is disabled', () => {
    it('aborts early without loading movements', async () => {
      setupDb({ enabled: false });

      await capturedOnRun();

      expect(utils.loadAircraftMovements).not.toHaveBeenCalled();
      expect(utils.setAssociatedMovement).not.toHaveBeenCalled();
    });

    it('aborts when enabled is null', async () => {
      setupDb({ enabled: null });

      await capturedOnRun();

      expect(utils.loadAircraftMovements).not.toHaveBeenCalled();
    });
  });

  describe('when cron job is enabled', () => {
    it('runs without error when there are no movements', async () => {
      setupDb({ enabled: true, departures: [], arrivals: [] });

      await capturedOnRun();

      expect(utils.setAssociatedMovement).not.toHaveBeenCalled();
    });

    it('calls setAssociatedMovement for each movement without association', async () => {
      const departure = {
        key: 'dep-001',
        immatriculation: 'HBKOF',
        dateTime: '2024-01-01T10:00:00'
      };

      setupDb({
        enabled: true,
        departures: [departure],
        arrivals: [],
        associations: [] // no associations yet
      });

      const aircraftMovements = [
        { key: 'dep-001', type: 'departure', immatriculation: 'HBKOF', dateTime: '2024-01-01T10:00:00', departureRoute: 'north' }
      ];

      utils.loadAircraftMovements.mockResolvedValue(aircraftMovements);
      utils.isHomeBase.mockResolvedValue(true);
      utils.getAssociatedMovement.mockReturnValue(null);
      utils.setAssociatedMovement.mockResolvedValue();

      await capturedOnRun();

      expect(utils.loadAircraftMovements).toHaveBeenCalledWith('HBKOF');
      expect(utils.setAssociatedMovement).toHaveBeenCalledWith('dep-001', 'departure', null);
    });

    it('processes each immatriculation only once', async () => {
      const dep1 = { key: 'dep-001', immatriculation: 'HBKOF', dateTime: '2024-01-01T10:00:00' };
      const dep2 = { key: 'dep-002', immatriculation: 'HBKOF', dateTime: '2024-01-01T12:00:00' };

      setupDb({
        enabled: true,
        departures: [dep1, dep2],
        arrivals: [],
        associations: []
      });

      const aircraftMovements = [
        { key: 'dep-001', type: 'departure', immatriculation: 'HBKOF', dateTime: '2024-01-01T10:00:00', departureRoute: 'north' },
        { key: 'dep-002', type: 'departure', immatriculation: 'HBKOF', dateTime: '2024-01-01T12:00:00', departureRoute: 'north' }
      ];

      utils.loadAircraftMovements.mockResolvedValue(aircraftMovements);
      utils.isHomeBase.mockResolvedValue(false);
      utils.getAssociatedMovement.mockReturnValue(null);
      utils.setAssociatedMovement.mockResolvedValue();

      await capturedOnRun();

      // loadAircraftMovements should be called once per immatriculation, not once per movement
      expect(utils.loadAircraftMovements).toHaveBeenCalledTimes(1);
      expect(utils.loadAircraftMovements).toHaveBeenCalledWith('HBKOF');
    });

    it('skips movements that already have associations', async () => {
      const departure = { key: 'dep-001', immatriculation: 'HBKOF', dateTime: '2024-01-01T10:00:00' };
      const association = { key: 'dep-001' }; // association exists

      setupDb({
        enabled: true,
        departures: [departure],
        arrivals: [],
        associations: [association] // dep-001 already has an association
      });

      await capturedOnRun();

      // No movements without associations, so nothing to process
      expect(utils.loadAircraftMovements).not.toHaveBeenCalled();
    });

    it('processes departures and arrivals from both collections', async () => {
      const departure = { key: 'dep-001', immatriculation: 'HBABC', dateTime: '2024-01-01T10:00:00' };
      const arrival = { key: 'arr-001', immatriculation: 'HBXYZ', dateTime: '2024-01-01T11:00:00' };

      setupDb({
        enabled: true,
        departures: [departure],
        arrivals: [arrival],
        associations: []
      });

      utils.loadAircraftMovements.mockResolvedValue([]);
      utils.isHomeBase.mockResolvedValue(false);
      utils.getAssociatedMovement.mockReturnValue(null);
      utils.setAssociatedMovement.mockResolvedValue();

      await capturedOnRun();

      // Two distinct immatriculations processed
      expect(utils.loadAircraftMovements).toHaveBeenCalledWith('HBABC');
      expect(utils.loadAircraftMovements).toHaveBeenCalledWith('HBXYZ');
    });
  });
});
