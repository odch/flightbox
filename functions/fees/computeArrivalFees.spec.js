'use strict';

let mockCapturedHandler = null;

jest.mock('firebase-functions/v2/database', () => ({
  onValueWritten: jest.fn((opts, handler) => {
    mockCapturedHandler = handler;
  })
}));

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

jest.mock('firebase-functions/v2', () => ({
  logger: mockLogger
}));

jest.mock('firebase-functions/params', () => ({
  defineString: jest.fn((name, opts) => ({ name, ...(opts || {}) }))
}));

const mockAdmin = {
  database: jest.fn()
};

jest.mock('firebase-admin', () => mockAdmin);

const { _test } = require('./computeArrivalFees');

// In-memory RTDB stub: `data` maps resolved paths to their stored value.
// Missing paths read back as null, matching RTDB semantics.
const makeDb = (data) => {
  const makeRef = (path) => ({
    once: () => Promise.resolve({ val: () => (path in data ? data[path] : null) }),
    child: (seg) => makeRef(`${path}/${seg}`)
  });
  return { ref: (path) => makeRef(path.replace(/\/+$/, '')) };
};

// Event whose `after` snapshot carries the arrival and captures write-backs.
const makeEvent = (arrival, key = 'arr1') => {
  const update = jest.fn().mockResolvedValue();
  return {
    _update: update,
    data: {
      after: {
        exists: () => arrival !== null,
        val: () => arrival,
        ref: { key, update }
      }
    }
  };
};

describe('functions/fees/computeArrivalFees', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('is a no-op when the project has no landing-fee strategy (gate off)', async () => {
    mockAdmin.database.mockReturnValue(makeDb({})); // no /settings/landingFeesStrategy
    const event = makeEvent({ immatriculation: 'HBABC', mtow: 1001, flightType: 'private', aircraftCategory: 'Flugzeug', landingCount: 1 });
    await _test.recomputeArrivalFees(event);
    expect(event._update).not.toHaveBeenCalled();
  });

  it('is a no-op when the arrival was deleted', async () => {
    mockAdmin.database.mockReturnValue(makeDb({ '/settings/landingFeesStrategy': 'lspl' }));
    const event = makeEvent(null);
    await _test.recomputeArrivalFees(event);
    expect(event._update).not.toHaveBeenCalled();
  });

  it('is a no-op for an anonymized arrival', async () => {
    mockAdmin.database.mockReturnValue(makeDb({ '/settings/landingFeesStrategy': 'lspl' }));
    const event = makeEvent({ anonymized: true });
    await _test.recomputeArrivalFees(event);
    expect(event._update).not.toHaveBeenCalled();
  });

  it('prices an unknown registration from submitted data and flags it manual', async () => {
    mockAdmin.database.mockReturnValue(makeDb({ '/settings/landingFeesStrategy': 'lspl' }));
    const event = makeEvent({
      immatriculation: 'HBUNK', mtow: 1001, flightType: 'private',
      aircraftCategory: 'Flugzeug', landingCount: 1
    });
    await _test.recomputeArrivalFees(event);

    const update = event._update.mock.calls[0][0];
    expect(update.aircraftDataSource).toBe('manual');
    expect(update.landingFeeSingle).toBe(23.13);
    expect(update.feeTotalGross).toBe(25);
    expect(update.feeVat).toBe(1.87);
  });

  it('prices a known registration from the registry MTOW, not the submitted one', async () => {
    // Submitted MTOW (500) would price at 18.50; the registry MTOW (1001)
    // prices at 23.13. The registry must win, and the record's declared
    // mtow/category must be left untouched.
    mockAdmin.database.mockReturnValue(makeDb({
      '/settings/landingFeesStrategy': 'lspl',
      '/aircrafts/HBABC': { mtow: 1001, category: 'Flugzeug' }
    }));
    const event = makeEvent({
      immatriculation: 'HB-ABC', mtow: 500, flightType: 'private',
      aircraftCategory: 'Segelflugzeug', landingCount: 1
    });
    await _test.recomputeArrivalFees(event);

    const update = event._update.mock.calls[0][0];
    expect(update.aircraftDataSource).toBe('registry');
    expect(update.landingFeeSingle).toBe(23.13);
    expect(update.feeTotalGross).toBe(25);
    expect(update).not.toHaveProperty('mtow');
    expect(update).not.toHaveProperty('aircraftCategory');
  });

  it('applies the home-base discount and 0% VAT for a club aircraft', async () => {
    mockAdmin.database.mockReturnValue(makeDb({
      '/settings/landingFeesStrategy': 'lspl',
      '/settings/aircrafts/club': { 'HBCLB': true }
    }));
    const event = makeEvent({
      immatriculation: 'HBCLB', mtow: 2000, flightType: 'private',
      aircraftCategory: 'Flugzeug', landingCount: 2
    });
    await _test.recomputeArrivalFees(event);

    const update = event._update.mock.calls[0][0];
    expect(update.landingFeeSingle).toBe(7);
    expect(update.landingFeeTotal).toBe(14);
    expect(update.feeVat).toBe(0);
    expect(update.feeTotalGross).toBe(14);
  });

  it('does not write when the stored fees already match (loop guard)', async () => {
    mockAdmin.database.mockReturnValue(makeDb({ '/settings/landingFeesStrategy': 'lspl' }));
    // Pre-seed the arrival with exactly what the recompute would produce.
    const event = makeEvent({
      immatriculation: 'HBUNK', mtow: 1001, flightType: 'private',
      aircraftCategory: 'Flugzeug', landingCount: 1,
      aircraftDataSource: 'manual',
      landingFeeSingle: 23.13, landingFeeCode: null, landingFeeTotal: 23.13,
      goAroundFeeSingle: null, goAroundFeeCode: null, goAroundFeeTotal: null,
      feeTotalNet: 23.13, feeVat: 1.87, feeRoundingDifference: 0, feeTotalGross: 25
    });
    await _test.recomputeArrivalFees(event);
    expect(event._update).not.toHaveBeenCalled();
  });

  it('clears stale fee fields when the fee-determining inputs are incomplete', async () => {
    mockAdmin.database.mockReturnValue(makeDb({ '/settings/landingFeesStrategy': 'lspl' }));
    // flightType missing -> computeFees returns {} -> every fee field cleared.
    const event = makeEvent({
      immatriculation: 'HBUNK', mtow: 1001, aircraftCategory: 'Flugzeug',
      landingFeeSingle: 99, feeTotalGross: 99
    });
    await _test.recomputeArrivalFees(event);

    const update = event._update.mock.calls[0][0];
    expect(update.landingFeeSingle).toBeNull();
    expect(update.feeTotalGross).toBeNull();
  });

  it('fails closed (writes nothing) when the strategy is not available server-side', async () => {
    mockAdmin.database.mockReturnValue(makeDb({ '/settings/landingFeesStrategy': 'lszt' }));
    const event = makeEvent({
      immatriculation: 'HBUNK', mtow: 1001, flightType: 'private',
      aircraftCategory: 'Flugzeug', landingCount: 1
    });
    await _test.recomputeArrivalFees(event);
    expect(event._update).not.toHaveBeenCalled();
    expect(mockLogger.error).toHaveBeenCalled();
  });

  describe('normalizeRegistration', () => {
    it('strips dashes/spaces and upper-cases', () => {
      expect(_test.normalizeRegistration('hb-abc')).toBe('HBABC');
      expect(_test.normalizeRegistration(' hb abc ')).toBe('HBABC');
      expect(_test.normalizeRegistration(undefined)).toBe('');
    });
  });
});
