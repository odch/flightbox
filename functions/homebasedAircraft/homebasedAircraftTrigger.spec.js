'use strict';

let capturedHandler;

jest.mock('firebase-functions/v1', () => {
  const mock = {
    config: jest.fn(() => ({ rtdb: { instance: 'test-instance' } })),
    database: {
      instance: jest.fn(() => ({
        ref: jest.fn(() => ({
          onWrite: jest.fn(handler => { capturedHandler = handler; }),
        })),
      })),
    },
  };
  mock.region = jest.fn(() => mock);
  return mock;
});

const mockAdminDbRef = jest.fn();
jest.mock('firebase-admin', () => ({
  database: jest.fn(() => ({ ref: mockAdminDbRef })),
}));

global.fetch = jest.fn();

describe('functions/homebasedAircraft/homebasedAircraftTrigger', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    capturedHandler = null;

    jest.mock('firebase-functions/v1', () => {
      const mock = {
        config: jest.fn(() => ({ rtdb: { instance: 'test-instance' } })),
        database: {
          instance: jest.fn(() => ({
            ref: jest.fn(() => ({
              onWrite: jest.fn(handler => { capturedHandler = handler; }),
            })),
          })),
        },
      };
      mock.region = jest.fn(() => mock);
      return mock;
    });

    jest.mock('firebase-admin', () => ({
      database: jest.fn(() => ({ ref: mockAdminDbRef })),
    }));

    require('./homebasedAircraftTrigger');
  });

  const makeChange = (before, after) => ({
    before: { val: () => before },
    after: { val: () => after },
  });

  it('does nothing when before and after are equal', async () => {
    const value = { homeBase: { HBXYZ: true }, club: { HBABC: true } };
    const change = makeChange(value, value);
    await capturedHandler(change, {});
    expect(mockAdminDbRef).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('does nothing when only an unrelated sibling subtree changed', async () => {
    const change = makeChange(
      { homeBase: { HBXYZ: true }, club: { HBABC: true }, other: 1 },
      { homeBase: { HBXYZ: true }, club: { HBABC: true }, other: 2 }
    );
    await capturedHandler(change, {});
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
    await capturedHandler(change, {});
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
    await capturedHandler(change, {});
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
    await capturedHandler(change, {});

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
    await capturedHandler(change, {});

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
    await capturedHandler(change, {});

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

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const change = makeChange(
      { homeBase: { HBOLD: true } },
      { homeBase: { HBNEW: true } }
    );
    await capturedHandler(change, {});

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to update the homebased aircraft of the customs app',
      expect.anything()
    );
    expect(consoleSpy).toHaveBeenCalledWith('Response body', 'Not authorized');
    consoleSpy.mockRestore();
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

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const change = makeChange(
      { homeBase: { HBOLD: true } },
      { homeBase: { HBNEW: true } }
    );
    await expect(capturedHandler(change, {})).resolves.toBeUndefined();
    expect(consoleSpy).toHaveBeenCalledWith('Response body', '');
    consoleSpy.mockRestore();
  });
});
