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
  let currentSelfDeclarants;
  let statusSet;

  beforeEach(() => {
    jest.clearAllMocks();

    customsSettings = CUSTOMS_SETTINGS;
    currentSelfDeclarants = null;
    statusSet = jest.fn().mockResolvedValue(undefined);

    mockAdminDbRef.mockImplementation(path => {
      if (path === '/settings/customsDeclarationApp') {
        return { once: jest.fn().mockResolvedValue({ val: () => customsSettings }) };
      }
      if (path === '/settings/customsSelfDeclarationEmails') {
        return { once: jest.fn().mockResolvedValue({ val: () => currentSelfDeclarants }) };
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

  // no failure policy: deploying one requires --force, which CI doesn't pass
  it('listens on the self-declaration e-mails without retries', () => {
    expect(mockCapturedOptions).toEqual({
      region: '{{ params.RTDB_REGION }}',
      instance: '{{ params.RTDB_INSTANCE }}',
      ref: '/settings/customsSelfDeclarationEmails',
    });
  });

  it('does nothing when no customs declaration settings exist', async () => {
    customsSettings = null;
    await mockCapturedHandler({ data: makeChange(null, [{ email: 'a@example.com' }]) });
    expect(global.fetch).not.toHaveBeenCalled();
    expect(statusSet).not.toHaveBeenCalled();
  });

  it('does nothing when customs settings have no baseUrl', async () => {
    customsSettings = { aerodrome: 'LSZT', accessToken: 'tok123' };
    await mockCapturedHandler({ data: makeChange(null, [{ email: 'a@example.com' }]) });
    expect(global.fetch).not.toHaveBeenCalled();
    expect(statusSet).not.toHaveBeenCalled();
  });

  it('PUTs the current list to the customs app', async () => {
    global.fetch.mockResolvedValue(okResponse({ accepted: 2, rejected: [] }));
    currentSelfDeclarants = [
      { email: 'alice@example.com', registrations: ['HBKLA', 'HBKLB'] },
      { email: 'bob@example.com' },
    ];

    await mockCapturedHandler({ data: makeChange(null, currentSelfDeclarants) });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://customs.example.com/api/self-declaration-emails?ad=LSZT',
      {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer tok123',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          { email: 'alice@example.com', registrations: ['HBKLA', 'HBKLB'] },
          { email: 'bob@example.com', registrations: [] },
        ]),
      }
    );
  });

  it('pushes the value currently stored rather than the event data', async () => {
    global.fetch.mockResolvedValue(okResponse());
    currentSelfDeclarants = [{ email: 'newest@example.com', registrations: ['HBKLA'] }];

    await mockCapturedHandler({
      data: makeChange(
        [{ email: 'old@example.com', registrations: ['HBKLA'] }],
        [{ email: 'stale@example.com', registrations: ['HBKLA'] }]
      ),
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: JSON.stringify([{ email: 'newest@example.com', registrations: ['HBKLA'] }]),
      })
    );
  });

  it('sends an empty array when the list was deleted', async () => {
    global.fetch.mockResolvedValue(okResponse());

    await mockCapturedHandler({ data: makeChange([{ email: 'a@example.com' }], null) });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ body: JSON.stringify([]) })
    );
  });

  it('records a successful sync including the rejected entries', async () => {
    global.fetch.mockResolvedValue(okResponse({ accepted: 1, rejected: ['bad@'] }));
    currentSelfDeclarants = [
      { email: 'good@example.com', registrations: ['HBKLA'] },
      { email: 'bad@', registrations: ['HBKLB'] },
    ];

    await mockCapturedHandler({ data: makeChange(null, currentSelfDeclarants) });

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
    currentSelfDeclarants = [{ email: 'a@example.com', registrations: ['HBKLA'] }];

    await expect(mockCapturedHandler({ data: makeChange(null, currentSelfDeclarants) })).resolves.toBeUndefined();

    expect(statusSet).toHaveBeenCalledWith({
      status: 'error',
      httpStatus: 404,
      timestamp: expect.any(String),
    });
  });

  it('throws on a server error so the execution fails', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: jest.fn().mockResolvedValue({ message: 'Internal error' }),
    });
    currentSelfDeclarants = [{ email: 'a@example.com', registrations: ['HBKLA'] }];

    await expect(mockCapturedHandler({ data: makeChange(null, currentSelfDeclarants) })).rejects.toThrow('HTTP 500');

    expect(statusSet).toHaveBeenCalledWith({
      status: 'error',
      httpStatus: 500,
      timestamp: expect.any(String),
    });
  });

  it('throws on a network error so the execution fails', async () => {
    global.fetch.mockRejectedValue(new TypeError('fetch failed'));
    currentSelfDeclarants = [{ email: 'a@example.com', registrations: ['HBKLA'] }];

    await expect(mockCapturedHandler({ data: makeChange(null, currentSelfDeclarants) })).rejects.toThrow('fetch failed');

    expect(statusSet).toHaveBeenCalledWith({
      status: 'error',
      timestamp: expect.any(String),
    });
  });

  describe('buildBody', () => {
    it('sends each person with their registrations', () => {
      expect(buildBody([
        { email: 'alice@example.com', registrations: ['HBKLA', 'HBKLB'] },
        { email: 'bob@example.com', registrations: ['DEABC'] },
      ])).toEqual([
        { email: 'alice@example.com', registrations: ['HBKLA', 'HBKLB'] },
        { email: 'bob@example.com', registrations: ['DEABC'] },
      ]);
    });

    it('trims and lower-cases the e-mails', () => {
      expect(buildBody([{ email: ' Alice@Example.COM ', registrations: ['HBKLA'] }])).toEqual([
        { email: 'alice@example.com', registrations: ['HBKLA'] },
      ]);
    });

    it('normalises the registrations and drops duplicate, empty, too long and non-string ones', () => {
      expect(buildBody([
        { email: 'a@example.com', registrations: ['hb-kla', 'HB KLA', 'HBKLB', '--', 'ABCDEFGHIJK', 'ABCDEFGHIJ', 42, null] },
      ])).toEqual([
        { email: 'a@example.com', registrations: ['HBKLA', 'HBKLB', 'ABCDEFGHIJ'] },
      ]);
    });

    it('sends a person without registrations with an empty list', () => {
      expect(buildBody([{ email: 'a@example.com' }, { email: 'b@example.com', registrations: 'HBKLA' }])).toEqual([
        { email: 'a@example.com', registrations: [] },
        { email: 'b@example.com', registrations: [] },
      ]);
    });

    it('sends legacy plain e-mail entries as persons without registrations', () => {
      expect(buildBody([' Alice@Example.COM ', 'bob@example.com'])).toEqual([
        { email: 'alice@example.com', registrations: [] },
        { email: 'bob@example.com', registrations: [] },
      ]);
    });

    it('merges duplicate e-mails, keeping the registrations of both', () => {
      expect(buildBody([
        { email: 'a@example.com', registrations: ['HBKLA'] },
        'A@example.com',
        { email: 'a@example.com ', registrations: ['HBKLB', 'hb-kla'] },
      ])).toEqual([
        { email: 'a@example.com', registrations: ['HBKLA', 'HBKLB'] },
      ]);
    });

    it('drops entries without a non-empty e-mail', () => {
      expect(buildBody([
        { email: 'a@example.com' },
        42,
        null,
        {},
        { email: 42, registrations: ['HBKLA'] },
        { registrations: ['HBKLA'] },
        '  ',
        { email: ' ', registrations: ['HBKLA'] },
      ])).toEqual([
        { email: 'a@example.com', registrations: [] },
      ]);
    });

    it('accepts sparse lists stored as objects', () => {
      expect(buildBody({
        0: { email: 'a@example.com', registrations: { 1: 'HBKLA' } },
        2: 'c@example.com',
      })).toEqual([
        { email: 'a@example.com', registrations: ['HBKLA'] },
        { email: 'c@example.com', registrations: [] },
      ]);
    });

    it('returns an empty array for null', () => {
      expect(buildBody(null)).toEqual([]);
    });
  });
});
