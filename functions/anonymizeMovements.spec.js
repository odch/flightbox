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
        privacyPolicyAcceptedAt: '2023-01-15T09:55:00.000Z',
        location: 'LSZT',
        flightType: 'private',
        negativeTimestamp: -1673776800000,
      },
    });

    mockRefData['/departures'] = movementSnapshot;
    mockRefData['/arrivals'] = movementSnapshot;

    const { scheduledAnonymizeMovements } = require('./anonymizeMovements');
    await scheduledAnonymizeMovements();

    expect(mockUpdate).toHaveBeenCalledTimes(2);

    const departureUpdates = mockUpdate.mock.calls[0][0];

    expect(departureUpdates['mov1/firstname']).toBeNull();
    expect(departureUpdates['mov1/lastname']).toBeNull();
    expect(departureUpdates['mov1/email']).toBeNull();
    expect(departureUpdates['mov1/phone']).toBeNull();
    expect(departureUpdates['mov1/memberNr']).toBeNull();
    expect(departureUpdates['mov1/immatriculation']).toBeNull();
    expect(departureUpdates['mov1/remarks']).toBeNull();
    expect(departureUpdates['mov1/createdBy']).toBeNull();
    expect(departureUpdates['mov1/createdBy_orderKey']).toBeNull();
    expect(departureUpdates['mov1/privacyPolicyAcceptedAt']).toBeNull();
    expect(departureUpdates['mov1/anonymized']).toBe(true);

    // Non-PII fields are preserved
    expect(departureUpdates['mov1/aircraftType']).toBeUndefined();
    expect(departureUpdates['mov1/mtow']).toBeUndefined();
    expect(departureUpdates['mov1/location']).toBeUndefined();
    expect(departureUpdates['mov1/flightType']).toBeUndefined();
    expect(departureUpdates['mov1/dateTime']).toBeUndefined();

    const arrivalUpdates = mockUpdate.mock.calls[1][0];
    expect(arrivalUpdates['mov1/firstname']).toBeNull();
    expect(arrivalUpdates['mov1/anonymized']).toBe(true);
    expect(arrivalUpdates['mov1/location']).toBeUndefined();
  });

  it('should only null out PII fields that are present on the record', async () => {
    mockRefData['/settings/movementRetentionDays'] = createValueSnapshot(730);

    // Movement without carriageVoucher, customsFormId, customsFormUrl
    const snapshot = createSnapshot({
      'mov1': {
        dateTime: '2023-01-15T10:00:00.000Z',
        firstname: 'Hans',
        lastname: 'Muster',
        location: 'LSZT',
      },
    });

    mockRefData['/departures'] = snapshot;
    mockRefData['/arrivals'] = { forEach: () => {} };

    const { scheduledAnonymizeMovements } = require('./anonymizeMovements');
    await scheduledAnonymizeMovements();

    expect(mockUpdate).toHaveBeenCalledTimes(1);

    const updates = mockUpdate.mock.calls[0][0];
    expect(updates['mov1/firstname']).toBeNull();
    expect(updates['mov1/lastname']).toBeNull();
    expect(updates['mov1/anonymized']).toBe(true);

    // Fields absent from the record must not appear in the update object
    expect(updates['mov1/customsFormId']).toBeUndefined();
    expect(updates['mov1/customsFormUrl']).toBeUndefined();
    expect(updates['mov1/email']).toBeUndefined();
    expect(updates['mov1/phone']).toBeUndefined();
  });

  it('should anonymize invoiceRecipientName from paymentMethod', async () => {
    mockRefData['/settings/movementRetentionDays'] = createValueSnapshot(730);

    const snapshot = createSnapshot({
      'mov1': {
        dateTime: '2023-01-15T10:00:00.000Z',
        firstname: 'Hans',
        lastname: 'Muster',
        paymentMethod: {
          method: 'invoice',
          invoiceRecipientName: 'Fluggruppe Thurgau',
        },
        location: 'LSZT',
      },
    });

    mockRefData['/departures'] = { forEach: () => {} };
    mockRefData['/arrivals'] = snapshot;

    const { scheduledAnonymizeMovements } = require('./anonymizeMovements');
    await scheduledAnonymizeMovements();

    expect(mockUpdate).toHaveBeenCalledTimes(1);

    const updates = mockUpdate.mock.calls[0][0];
    expect(updates['mov1/paymentMethod/invoiceRecipientName']).toBeNull();
    // payment method itself is preserved
    expect(updates['mov1/paymentMethod']).toBeUndefined();
  });

  it('should not add paymentMethod update when invoiceRecipientName is absent', async () => {
    mockRefData['/settings/movementRetentionDays'] = createValueSnapshot(730);

    const snapshot = createSnapshot({
      'mov1': {
        dateTime: '2023-01-15T10:00:00.000Z',
        firstname: 'Hans',
        paymentMethod: { method: 'cash' },
        location: 'LSZT',
      },
    });

    mockRefData['/departures'] = { forEach: () => {} };
    mockRefData['/arrivals'] = snapshot;

    const { scheduledAnonymizeMovements } = require('./anonymizeMovements');
    await scheduledAnonymizeMovements();

    expect(mockUpdate).toHaveBeenCalledTimes(1);

    const updates = mockUpdate.mock.calls[0][0];
    expect(updates['mov1/paymentMethod/invoiceRecipientName']).toBeUndefined();
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
