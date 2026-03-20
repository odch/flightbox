'use strict';

let mockRefData = {};
let mockCurrentRefPath = '';

const mockUpdate = jest.fn().mockResolvedValue();
const mockOnce = jest.fn().mockImplementation(() => {
  return Promise.resolve(mockRefData[mockCurrentRefPath] || { forEach: () => {} });
});
const mockEndAt = jest.fn().mockReturnValue({ once: mockOnce });
const mockOrderByChild = jest.fn().mockReturnValue({ endAt: mockEndAt });
const mockRef = jest.fn().mockImplementation(path => {
  mockCurrentRefPath = path;
  return { orderByChild: mockOrderByChild, update: mockUpdate, once: mockOnce };
});

jest.mock('firebase-admin', () => ({
  database: jest.fn().mockReturnValue({ ref: mockRef }),
  initializeApp: jest.fn(),
}));

jest.mock('firebase-functions', () => ({
  region: jest.fn().mockReturnThis(),
  pubsub: {
    schedule: jest.fn().mockReturnValue({
      timeZone: jest.fn().mockReturnValue({
        onRun: jest.fn(fn => fn),
      }),
    }),
  },
}));

function createSnapshot(data) {
  const entries = Object.entries(data);
  return {
    forEach(cb) {
      entries.forEach(([key, val]) => {
        cb({ key, val: () => val });
      });
    },
  };
}

function createValueSnapshot(val) {
  return { val: () => val };
}

describe('anonymizeMovements', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    mockRefData = {};
    mockCurrentRefPath = '';
  });

  it('should skip when movementRetentionDays is not set', async () => {
    mockRefData['/settings/movementRetentionDays'] = createValueSnapshot(null);

    const { scheduledAnonymizeMovements } = require('./anonymizeMovements');
    await scheduledAnonymizeMovements();

    expect(mockOrderByChild).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('should anonymize movements older than configured retention', async () => {
    mockRefData['/settings/movementRetentionDays'] = createValueSnapshot(730);

    const oldDate = '2023-01-15T10:00:00.000Z';
    const movementSnapshot = createSnapshot({
      'mov1': {
        dateTime: oldDate,
        firstname: 'Hans',
        lastname: 'Muster',
        email: 'hans@example.com',
        phone: '+41791234567',
        memberNr: '123',
        immatriculation: 'HB-ABC',
        aircraftType: 'C172',
        mtow: 1111,
        remarks: 'test',
        createdBy: 'uid1',
        createdBy_orderKey: 'uid1_123',
        location: 'LSZT',
        flightType: 'private',
        negativeTimestamp: -1673776800000,
      },
    });

    mockRefData['/departures'] = movementSnapshot;
    mockRefData['/arrivals'] = movementSnapshot;

    const { scheduledAnonymizeMovements } = require('./anonymizeMovements');
    await scheduledAnonymizeMovements();

    expect(mockUpdate).toHaveBeenCalled();

    const updates = mockUpdate.mock.calls[0][0];

    expect(updates['mov1/firstname']).toBeNull();
    expect(updates['mov1/lastname']).toBeNull();
    expect(updates['mov1/email']).toBeNull();
    expect(updates['mov1/phone']).toBeNull();
    expect(updates['mov1/memberNr']).toBeNull();
    expect(updates['mov1/immatriculation']).toBeNull();
    expect(updates['mov1/aircraftType']).toBeNull();
    expect(updates['mov1/mtow']).toBeNull();
    expect(updates['mov1/remarks']).toBeNull();
    expect(updates['mov1/createdBy']).toBeNull();
    expect(updates['mov1/createdBy_orderKey']).toBeNull();
    expect(updates['mov1/anonymized']).toBe(true);

    expect(updates['mov1/location']).toBeUndefined();
    expect(updates['mov1/flightType']).toBeUndefined();
    expect(updates['mov1/dateTime']).toBeUndefined();
  });

  it('should skip already anonymized movements', async () => {
    mockRefData['/settings/movementRetentionDays'] = createValueSnapshot(730);

    const snapshot = createSnapshot({
      'mov1': {
        dateTime: '2023-01-15T10:00:00.000Z',
        anonymized: true,
        location: 'LSZT',
      },
    });

    mockRefData['/departures'] = snapshot;
    mockRefData['/arrivals'] = snapshot;

    const { scheduledAnonymizeMovements } = require('./anonymizeMovements');
    await scheduledAnonymizeMovements();

    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
