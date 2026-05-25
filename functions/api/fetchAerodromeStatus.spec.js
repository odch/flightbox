'use strict';

const fetchAerodromeStatus = require('./fetchAerodromeStatus');

describe('functions/api/fetchAerodromeStatus', () => {
  const makeFirebase = (val) => ({
    ref: jest.fn().mockReturnValue({
      orderByChild: jest.fn().mockReturnThis(),
      limitToLast: jest.fn().mockReturnThis(),
      once: jest.fn().mockResolvedValue({ val: () => val }),
    }),
  });

  it('returns formatted status when data exists', async () => {
    const timestamp = new Date('2026-01-15T10:00:00Z').getTime();
    const firebase = makeFirebase({
      abc: {
        status: 'open',
        timestamp,
        by: 'Hans Meier',
        uid: 'uid-123',
        firstname: 'Hans',
        lastname: 'Meier',
        email: 'hans@example.ch',
        details: 'All clear',
      },
    });

    const result = await fetchAerodromeStatus(firebase);

    expect(result).toEqual({
      status: 'open',
      last_update_date: '2026-01-15T10:00:00.000Z',
      last_update_by: 'Hans Meier',
      last_update_user: {
        uid: 'uid-123',
        firstname: 'Hans',
        lastname: 'Meier',
        email: 'hans@example.ch',
      },
      message: 'All clear',
    });
  });

  it('omits last_update_user for legacy records without user fields', async () => {
    const timestamp = new Date('2026-01-15T10:00:00Z').getTime();
    const firebase = makeFirebase({
      abc: { status: 'open', timestamp, by: 'pilot@example.com', details: 'All clear' },
    });

    const result = await fetchAerodromeStatus(firebase);

    expect(result).toEqual({
      status: 'open',
      last_update_date: '2026-01-15T10:00:00.000Z',
      last_update_by: 'pilot@example.com',
      message: 'All clear',
    });
    expect(result.last_update_user).toBeUndefined();
  });

  it('includes only uid in last_update_user when profile fields are missing', async () => {
    const timestamp = new Date('2026-01-15T10:00:00Z').getTime();
    const firebase = makeFirebase({
      abc: {
        status: 'closed',
        timestamp,
        by: 'uid-123',
        uid: 'uid-123',
        firstname: null,
        lastname: null,
        email: null,
        details: '',
      },
    });

    const result = await fetchAerodromeStatus(firebase);

    expect(result.last_update_user).toEqual({ uid: 'uid-123' });
  });

  it('returns empty object when no data exists', async () => {
    const firebase = makeFirebase(null);
    const result = await fetchAerodromeStatus(firebase);
    expect(result).toEqual({});
  });

  it('queries /status ref ordered by timestamp limited to last 1', async () => {
    const mockRef = {
      orderByChild: jest.fn().mockReturnThis(),
      limitToLast: jest.fn().mockReturnThis(),
      once: jest.fn().mockResolvedValue({ val: () => null }),
    };
    const firebase = { ref: jest.fn().mockReturnValue(mockRef) };

    await fetchAerodromeStatus(firebase);

    expect(firebase.ref).toHaveBeenCalledWith('/status');
    expect(mockRef.orderByChild).toHaveBeenCalledWith('timestamp');
    expect(mockRef.limitToLast).toHaveBeenCalledWith(1);
  });
});
