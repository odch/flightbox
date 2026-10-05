'use strict';

let mockCapturedOptions = null;
let mockCapturedHandler = null;

jest.mock('firebase-functions/v2/database', () => ({
  onValueWritten: jest.fn((opts, handler) => {
    mockCapturedOptions = opts;
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
jest.mock('firebase-admin/database', () => ({
  getDatabase: jest.fn(() => ({ ref: mockAdminDbRef })),
}));

global.fetch = jest.fn();

const { buildBody } = require('./selfDeclarationEmailsTrigger');

const CUSTOMS_SETTINGS = {
  baseUrl: 'https://customs.example.com',
  aerodrome: 'LSZT',
  accessToken: 'tok123',
};

describe('functions/customs/selfDeclarationEmailsTrigger', () => {
  let customsSettings;
  let currentEmails;
  let statusSet;

  beforeEach(() => {
    jest.clearAllMocks();

    customsSettings = CUSTOMS_SETTINGS;
    currentEmails = null;
    statusSet = jest.fn().mockResolvedValue(undefined);

    mockAdminDbRef.mockImplementation(path => {
      if (path === '/settings/customsDeclarationApp') {
        return { once: jest.fn().mockResolvedValue({ val: () => customsSettings }) };
      }
      if (path === '/settings/customsSelfDeclarationEmails') {
        return { once: jest.fn().mockResolvedValue({ val: () => currentEmails }) };
      }
      if (path === '/settings/customsSyncStatus/selfDeclarationEmails') {
        return { set: statusSet };
      }
      throw new Error(`Unexpected ref ${path}`);
    });
  });

  const makeChange = (before, after) => ({
    before: { val: () => before },
    after: { val: () => after },
  });

  const okResponse = (body = { accepted: 0, rejected: [] }) => ({
    ok: true,
    status: 200,
    json: jest.fn().mockResolvedValue(body),
  });

  it('listens on the self-declaration e-mails with retries enabled', () => {
    expect(mockCapturedOptions).toEqual({
      region: '{{ params.RTDB_REGION }}',
      instance: '{{ params.RTDB_INSTANCE }}',
      ref: '/settings/customsSelfDeclarationEmails',
      retry: true,
    });
  });

  it('does nothing when no customs declaration settings exist', async () => {
    customsSettings = null;
    await mockCapturedHandler({ data: makeChange(null, ['a@example.com']) });
    expect(global.fetch).not.toHaveBeenCalled();
    expect(statusSet).not.toHaveBeenCalled();
  });

  it('does nothing when customs settings have no baseUrl', async () => {
    customsSettings = { aerodrome: 'LSZT', accessToken: 'tok123' };
    await mockCapturedHandler({ data: makeChange(null, ['a@example.com']) });
    expect(global.fetch).not.toHaveBeenCalled();
    expect(statusSet).not.toHaveBeenCalled();
  });

  it('PUTs the current list to the customs app', async () => {
    global.fetch.mockResolvedValue(okResponse({ accepted: 2, rejected: [] }));
    currentEmails = ['alice@example.com', 'bob@example.com'];

    await mockCapturedHandler({ data: makeChange(null, currentEmails) });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://customs.example.com/api/self-declaration-emails?ad=LSZT',
      {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer tok123',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(['alice@example.com', 'bob@example.com']),
      }
    );
  });

  it('pushes the value currently stored rather than the event data', async () => {
    global.fetch.mockResolvedValue(okResponse());
    currentEmails = ['newest@example.com'];

    await mockCapturedHandler({ data: makeChange(['old@example.com'], ['stale@example.com']) });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ body: JSON.stringify(['newest@example.com']) })
    );
  });

  it('sends an empty array when the list was deleted', async () => {
    global.fetch.mockResolvedValue(okResponse());

    await mockCapturedHandler({ data: makeChange(['a@example.com'], null) });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ body: JSON.stringify([]) })
    );
  });

  it('records a successful sync including the rejected entries', async () => {
    global.fetch.mockResolvedValue(okResponse({ accepted: 1, rejected: ['bad@'] }));
    currentEmails = ['good@example.com', 'bad@'];

    await mockCapturedHandler({ data: makeChange(null, currentEmails) });

    expect(statusSet).toHaveBeenCalledWith({
      status: 'ok',
      rejected: ['bad@'],
      timestamp: expect.any(String),
    });
  });

  it('records an error without throwing on a client error', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: jest.fn().mockResolvedValue({ message: 'Unknown aerodrome' }),
    });
    currentEmails = ['a@example.com'];

    await expect(mockCapturedHandler({ data: makeChange(null, currentEmails) })).resolves.toBeUndefined();

    expect(statusSet).toHaveBeenCalledWith({
      status: 'error',
      httpStatus: 404,
      timestamp: expect.any(String),
    });
  });

  it('throws on a server error so the event is retried', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: jest.fn().mockResolvedValue({ message: 'Internal error' }),
    });
    currentEmails = ['a@example.com'];

    await expect(mockCapturedHandler({ data: makeChange(null, currentEmails) })).rejects.toThrow('HTTP 500');

    expect(statusSet).toHaveBeenCalledWith({
      status: 'error',
      httpStatus: 500,
      timestamp: expect.any(String),
    });
  });

  it('throws on a network error so the event is retried', async () => {
    global.fetch.mockRejectedValue(new TypeError('fetch failed'));
    currentEmails = ['a@example.com'];

    await expect(mockCapturedHandler({ data: makeChange(null, currentEmails) })).rejects.toThrow('fetch failed');

    expect(statusSet).toHaveBeenCalledWith({
      status: 'error',
      timestamp: expect.any(String),
    });
  });

  describe('buildBody', () => {
    it('trims and lower-cases the e-mails', () => {
      expect(buildBody([' Alice@Example.COM ', 'bob@example.com'])).toEqual([
        'alice@example.com',
        'bob@example.com',
      ]);
    });

    it('drops non-string, empty and duplicate entries', () => {
      expect(buildBody(['a@example.com', 42, null, { email: 'x' }, '  ', 'A@example.com'])).toEqual([
        'a@example.com',
      ]);
    });

    it('accepts a sparse list stored as an object', () => {
      expect(buildBody({ 0: 'a@example.com', 2: 'c@example.com' })).toEqual([
        'a@example.com',
        'c@example.com',
      ]);
    });

    it('returns an empty array for null', () => {
      expect(buildBody(null)).toEqual([]);
    });
  });
});
