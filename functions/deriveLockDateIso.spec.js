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

const { _test } = require('./deriveLockDateIso');

// In-memory RTDB stub. `data` maps a resolved path to its stored value; writes
// via set() are captured per path so assertions can inspect them.
const makeDb = (data) => {
  const writes = {};
  const makeRef = (path) => ({
    once: () => Promise.resolve({ val: () => (path in data ? data[path] : null) }),
    set: (val) => { writes[path] = val; data[path] = val; return Promise.resolve(); },
    child: (seg) => makeRef(`${path}/${seg}`)
  });
  return { ref: (path) => makeRef(path.replace(/\/+$/, '')), _writes: writes };
};

const makeEvent = (lockDate) => ({
  data: {
    after: {
      exists: () => lockDate !== null && lockDate !== undefined,
      val: () => lockDate
    }
  }
});

describe('functions/deriveLockDateIso', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('is a no-op when the project has not opted in', async () => {
    const db = makeDb({ '/settings/lockDate': 1700000000000 }); // no lockOnDateTime
    mockAdmin.database.mockReturnValue(db);
    await _test.deriveLockDateIso(makeEvent(1700000000000));
    expect(db._writes).toEqual({});
  });

  it('derives lockDateIso = ISO(lockDate + 1 day) when opted in', async () => {
    const lockDate = Date.UTC(2026, 0, 31, 0, 0, 0); // 2026-01-31T00:00:00Z
    const db = makeDb({ '/settings/lockOnDateTime': true });
    mockAdmin.database.mockReturnValue(db);

    await _test.deriveLockDateIso(makeEvent(lockDate));

    // +1 day grace -> 2026-02-01T00:00:00.000Z
    expect(db._writes['/settings/lockDateIso']).toBe('2026-02-01T00:00:00.000Z');
  });

  it('produces a threshold whose ordering matches the numeric rule', async () => {
    const lockDate = Date.UTC(2026, 5, 15, 12, 0, 0);
    const db = makeDb({ '/settings/lockOnDateTime': true });
    mockAdmin.database.mockReturnValue(db);

    await _test.deriveLockDateIso(makeEvent(lockDate));
    const iso = db._writes['/settings/lockDateIso'];

    const threshold = lockDate + _test.ONE_DAY_MS;
    // A movement one second after the threshold is allowed by both encodings.
    const after = new Date(threshold + 1000).toISOString();
    // A movement one second before is locked by both.
    const before = new Date(threshold - 1000).toISOString();
    expect(after > iso).toBe(true);
    expect(before > iso).toBe(false);
  });

  it('does not rewrite when already in sync (loop guard)', async () => {
    const lockDate = Date.UTC(2026, 0, 31, 0, 0, 0);
    const iso = new Date(lockDate + _test.ONE_DAY_MS).toISOString();
    const db = makeDb({
      '/settings/lockOnDateTime': true,
      '/settings/lockDateIso': iso
    });
    mockAdmin.database.mockReturnValue(db);

    await _test.deriveLockDateIso(makeEvent(lockDate));
    expect(db._writes).toEqual({});
  });

  it('clears lockDateIso when lockDate is removed', async () => {
    const db = makeDb({
      '/settings/lockOnDateTime': true,
      '/settings/lockDateIso': '2026-02-01T00:00:00.000Z'
    });
    mockAdmin.database.mockReturnValue(db);

    await _test.deriveLockDateIso(makeEvent(null));
    expect(db._writes['/settings/lockDateIso']).toBeNull();
  });

  it('ignores a non-numeric lockDate', async () => {
    const db = makeDb({ '/settings/lockOnDateTime': true });
    mockAdmin.database.mockReturnValue(db);

    await _test.deriveLockDateIso(makeEvent('not-a-number'));
    expect(db._writes).toEqual({});
    expect(mockLogger.warn).toHaveBeenCalled();
  });
});
