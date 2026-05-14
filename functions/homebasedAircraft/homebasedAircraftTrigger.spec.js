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
  error: jest.fn(),
  log: jest.fn()
};

jest.mock('firebase-functions/v2', () => ({
  logger: mockLogger
}));

jest.mock('firebase-functions/params', () => ({
  defineString: jest.fn(name => ({ name }))
}));

const mockAdminDbRef = jest.fn();
jest.mock('firebase-admin', () => ({
  database: jest.fn(() => ({ ref: mockAdminDbRef })),
}));

global.fetch = jest.fn();

require('./homebasedAircraftTrigger');

describe('functions/homebasedAircraft/homebasedAircraftTrigger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const makeChange = (before, after) => ({
    before: { val: () => before },
    after: { val: () => after },
  });

  it('does nothing when before and after are equal', async () => {
    const value = { homeBase: { HBXYZ: true }, club: { HBABC: true } };
    const change = makeChange(value, value);
    await mockCapturedHandler({ data: change });
    expect(mockAdminDbRef).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('does nothing when only an unrelated sibling subtree changed', async () => {
    const change = makeChange(
      { homeBase: { HBXYZ: true }, club: { HBABC: true }, other: 1 },
      { homeBase: { HBXYZ: true }, club: { HBABC: true }, other: 2 }
    );
    await mockCapturedHandler({ data: change });
    expect(mockAdminDbRef).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('does nothing when no customs declaration settings exist', async () => {
    mockAdminDbRef.mockReturnValue({
      once: jest.fn().mockResolvedValue({ val: () => null }),
    });
    const change = makeChange(
      { homeBase: { HBXYZ: true } },
      { homeBase: { HBABC: true } }
    );
    await mockCapturedHandler({ data: change });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('does nothing when customs settings have no baseUrl', async () => {
    mockAdminDbRef.mockReturnValue({
      once: jest.fn().mockResolvedValue({ val: () => ({ aerodrome: 'LSZT' }) }),
    });
    const change = makeChange(
      { homeBase: { HBXYZ: true } },
      { homeBase: { HBABC: true } }
    );
    await mockCapturedHandler({ data: change });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('sends PUT with union of homeBase and club registrations', async () => {
    mockAdminDbRef.mockReturnValue({
      once: jest.fn().mockResolvedValue({
        val: () => ({
          baseUrl: 'https://customs.example.com',
          aerodrome: 'LSZT',
          accessToken: 'tok123',
        }),
      }),
    });

    global.fetch.mockResolvedValue({ ok: true });

    const after = {
      homeBase: { HBXYZ: true, HBABC: true },
      club: { HBABC: true, HBCLU: true },
    };
    const change = makeChange({ homeBase: { HBOLD: true } }, after);
    await mockCapturedHandler({ data: change });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://customs.example.com/api/homebased-aircraft?ad=LSZT',
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          Authorization: 'Bearer tok123',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify([
          { registration: 'HBXYZ' },
          { registration: 'HBABC' },
          { registration: 'HBCLU' },
        ]),
      })
    );
  });

  it('handles missing homeBase or club subkey', async () => {
    mockAdminDbRef.mockReturnValue({
      once: jest.fn().mockResolvedValue({
        val: () => ({
          baseUrl: 'https://customs.example.com',
          aerodrome: 'LSZT',
          accessToken: 'tok123',
        }),
      }),
    });

    global.fetch.mockResolvedValue({ ok: true });

    const change = makeChange(
      { homeBase: { HBOLD: true }, club: { HBCLU: true } },
      { club: { HBCLU: true, HBNEW: true } }
    );
    await mockCapturedHandler({ data: change });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: JSON.stringify([
          { registration: 'HBCLU' },
          { registration: 'HBNEW' },
        ]),
      })
    );
  });

  it('handles null after value by sending empty array', async () => {
    mockAdminDbRef.mockReturnValue({
      once: jest.fn().mockResolvedValue({
        val: () => ({
          baseUrl: 'https://customs.example.com',
          aerodrome: 'LSZT',
          accessToken: 'tok123',
        }),
      }),
    });

    global.fetch.mockResolvedValue({ ok: true });

    const change = makeChange({ homeBase: { HBOLD: true } }, null);
    await mockCapturedHandler({ data: change });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ body: JSON.stringify([]) })
    );
  });

  it('logs error when fetch response is not ok', async () => {
    mockAdminDbRef.mockReturnValue({
      once: jest.fn().mockResolvedValue({
        val: () => ({
          baseUrl: 'https://customs.example.com',
          aerodrome: 'LSZT',
          accessToken: 'tok123',
        }),
      }),
    });

    global.fetch.mockResolvedValue({
      ok: false,
      text: jest.fn().mockResolvedValue('Not authorized'),
    });

    const change = makeChange(
      { homeBase: { HBOLD: true } },
      { homeBase: { HBNEW: true } }
    );
    await mockCapturedHandler({ data: change });

    expect(mockLogger.error).toHaveBeenCalledWith(
      'Failed to update the homebased aircraft of the customs app',
      expect.anything()
    );
    expect(mockLogger.error).toHaveBeenCalledWith('Response body', 'Not authorized');
  });

  it('tolerates non-text error responses without throwing', async () => {
    mockAdminDbRef.mockReturnValue({
      once: jest.fn().mockResolvedValue({
        val: () => ({
          baseUrl: 'https://customs.example.com',
          aerodrome: 'LSZT',
          accessToken: 'tok123',
        }),
      }),
    });

    global.fetch.mockResolvedValue({
      ok: false,
      text: jest.fn().mockRejectedValue(new Error('stream error')),
    });

    const change = makeChange(
      { homeBase: { HBOLD: true } },
      { homeBase: { HBNEW: true } }
    );
    await expect(mockCapturedHandler({ data: change })).resolves.toBeUndefined();
    expect(mockLogger.error).toHaveBeenCalledWith('Response body', '');
  });
});
