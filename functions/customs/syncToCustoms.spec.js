'use strict';

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn()
};

jest.mock('firebase-functions/v2', () => ({
  logger: mockLogger
}));

const mockAdminDbRef = jest.fn();
jest.mock('firebase-admin/database', () => ({
  getDatabase: jest.fn(() => ({ ref: mockAdminDbRef })),
}));

global.fetch = jest.fn();

const { syncToCustoms, toArray } = require('./syncToCustoms');

const SETTINGS = {
  baseUrl: 'https://customs.example.com',
  aerodrome: 'LSZT',
  accessToken: 'tok123',
};

const OPTIONS = {
  sourcePath: '/settings/source',
  endpoint: '/api/things',
  statusKey: 'things',
  buildBody: value => (value || []).map(v => v.toUpperCase()),
  label: 'things',
};

describe('functions/customs/syncToCustoms', () => {
  let statusSet;
  let sourceValue;
  let customsSettings;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date('2026-10-05T12:34:56.000Z'));

    customsSettings = SETTINGS;
    sourceValue = ['a', 'b'];
    statusSet = jest.fn().mockResolvedValue(undefined);

    mockAdminDbRef.mockImplementation(path => {
      if (path === '/settings/customsDeclarationApp') {
        return { once: jest.fn().mockResolvedValue({ val: () => customsSettings }) };
      }
      if (path === '/settings/source') {
        return { once: jest.fn().mockResolvedValue({ val: () => sourceValue }) };
      }
      if (path === '/settings/customsSyncStatus/things') {
        return { set: statusSet };
      }
      throw new Error(`Unexpected ref ${path}`);
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const jsonResponse = (status, body) => ({
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(body),
  });

  it('does nothing when no customs declaration settings exist', async () => {
    customsSettings = null;

    await syncToCustoms(OPTIONS);

    expect(global.fetch).not.toHaveBeenCalled();
    expect(statusSet).not.toHaveBeenCalled();
    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Aborting'));
  });

  it('does nothing when the customs settings have no baseUrl', async () => {
    customsSettings = { aerodrome: 'LSZT', accessToken: 'tok123' };

    await syncToCustoms(OPTIONS);

    expect(global.fetch).not.toHaveBeenCalled();
    expect(statusSet).not.toHaveBeenCalled();
  });

  it('PUTs the body built from the current value with the bearer token', async () => {
    global.fetch.mockResolvedValue(jsonResponse(200, { accepted: 2, rejected: [] }));

    await syncToCustoms(OPTIONS);

    expect(global.fetch).toHaveBeenCalledWith(
      'https://customs.example.com/api/things?ad=LSZT',
      {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer tok123',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(['A', 'B']),
      }
    );
  });

  it('passes null to buildBody when the value does not exist', async () => {
    sourceValue = null;
    global.fetch.mockResolvedValue(jsonResponse(200, { accepted: 0, rejected: [] }));

    await syncToCustoms(OPTIONS);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ body: JSON.stringify([]) })
    );
  });

  it('encodes the aerodrome in the query string', async () => {
    customsSettings = { ...SETTINGS, aerodrome: 'LS&ZT=x y' };
    global.fetch.mockResolvedValue(jsonResponse(200, {}));

    await syncToCustoms(OPTIONS);

    expect(global.fetch).toHaveBeenCalledWith(
      'https://customs.example.com/api/things?ad=LS%26ZT%3Dx%20y',
      expect.anything()
    );
  });

  it('writes an ok status on success', async () => {
    global.fetch.mockResolvedValue(jsonResponse(200, { accepted: 2, rejected: [] }));

    await syncToCustoms(OPTIONS);

    expect(mockAdminDbRef).toHaveBeenCalledWith('/settings/customsSyncStatus/things');
    expect(statusSet).toHaveBeenCalledWith({
      status: 'ok',
      timestamp: '2026-10-05T12:34:56.000Z',
    });
  });

  it('records the entries the customs app rejected', async () => {
    global.fetch.mockResolvedValue(jsonResponse(200, { accepted: 1, rejected: ['bad', 42, 'worse'] }));

    await syncToCustoms(OPTIONS);

    expect(statusSet).toHaveBeenCalledWith({
      status: 'ok',
      rejected: ['bad', 'worse'],
      timestamp: '2026-10-05T12:34:56.000Z',
    });
  });

  it('logs only the number of rejected entries, not the entries', async () => {
    global.fetch.mockResolvedValue(jsonResponse(200, { accepted: 0, rejected: ['max@example.ch'] }));

    await syncToCustoms(OPTIONS);

    expect(mockLogger.warn).toHaveBeenCalledWith(expect.any(String), { rejectedCount: 1 });
    expect(JSON.stringify(mockLogger.warn.mock.calls)).not.toContain('max@example.ch');
  });

  it('writes an ok status when a 2xx response has no JSON body', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 204,
      json: jest.fn().mockRejectedValue(new SyntaxError('Unexpected end of JSON input')),
    });

    await syncToCustoms(OPTIONS);

    expect(statusSet).toHaveBeenCalledWith({
      status: 'ok',
      timestamp: '2026-10-05T12:34:56.000Z',
    });
  });

  it.each([400, 401, 404, 405])('writes an error status and does not throw on HTTP %s', async (status) => {
    global.fetch.mockResolvedValue(jsonResponse(status, { message: 'nope' }));

    await expect(syncToCustoms(OPTIONS)).resolves.toBeUndefined();

    expect(statusSet).toHaveBeenCalledWith({
      status: 'error',
      httpStatus: status,
      timestamp: '2026-10-05T12:34:56.000Z',
    });
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Failed to update the things of the customs app',
      { httpStatus: status, body: { message: 'nope' } }
    );
  });

  it('writes an error status and throws on HTTP 5xx', async () => {
    global.fetch.mockResolvedValue(jsonResponse(500, { message: 'boom' }));

    await expect(syncToCustoms(OPTIONS)).rejects.toThrow('The customs app responded with HTTP 500');

    expect(statusSet).toHaveBeenCalledWith({
      status: 'error',
      httpStatus: 500,
      timestamp: '2026-10-05T12:34:56.000Z',
    });
  });

  it('handles a 5xx response without a JSON body', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 502,
      json: jest.fn().mockRejectedValue(new SyntaxError('Unexpected token <')),
    });

    await expect(syncToCustoms(OPTIONS)).rejects.toThrow('HTTP 502');

    expect(statusSet).toHaveBeenCalledWith({
      status: 'error',
      httpStatus: 502,
      timestamp: '2026-10-05T12:34:56.000Z',
    });
  });

  it('writes an error status and rethrows on a network error', async () => {
    const networkError = new TypeError('fetch failed');
    global.fetch.mockRejectedValue(networkError);

    await expect(syncToCustoms(OPTIONS)).rejects.toBe(networkError);

    expect(statusSet).toHaveBeenCalledWith({
      status: 'error',
      timestamp: '2026-10-05T12:34:56.000Z',
    });
  });

  it('does not fail the sync when the status cannot be written', async () => {
    global.fetch.mockResolvedValue(jsonResponse(200, { accepted: 2, rejected: [] }));
    statusSet.mockRejectedValue(new Error('db down'));

    await expect(syncToCustoms(OPTIONS)).resolves.toBeUndefined();

    expect(mockLogger.error).toHaveBeenCalledWith(
      'Failed to write the customs sync status for things',
      expect.any(Error)
    );
  });

  describe('toArray', () => {
    it('returns arrays unchanged', () => {
      expect(toArray(['a', 'b'])).toEqual(['a', 'b']);
    });

    it('returns the values of an object (sparse RTDB array)', () => {
      expect(toArray({ 0: 'a', 2: 'c' })).toEqual(['a', 'c']);
    });

    it.each([null, undefined, 'x', 42])('returns an empty array for %p', (value) => {
      expect(toArray(value)).toEqual([]);
    });
  });
});
