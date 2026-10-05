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

const { buildBody } = require('./invoiceRecipientsTrigger');

const CUSTOMS_SETTINGS = {
  baseUrl: 'https://customs.example.com',
  aerodrome: 'LSZT',
  accessToken: 'tok123',
};

describe('functions/invoiceRecipients/invoiceRecipientsTrigger', () => {
  let customsSettings;
  let currentRecipients;
  let statusSet;

  beforeEach(() => {
    jest.clearAllMocks();

    customsSettings = CUSTOMS_SETTINGS;
    currentRecipients = null;
    statusSet = jest.fn().mockResolvedValue(undefined);

    mockAdminDbRef.mockImplementation(path => {
      if (path === '/settings/customsDeclarationApp') {
        return { once: jest.fn().mockResolvedValue({ val: () => customsSettings }) };
      }
      if (path === '/settings/invoiceRecipients') {
        return { once: jest.fn().mockResolvedValue({ val: () => currentRecipients }) };
      }
      if (path === '/settings/customsSyncStatus/invoiceRecipients') {
        return { set: statusSet };
      }
      throw new Error(`Unexpected ref ${path}`);
    });
  });

  const makeChange = (before, after) => ({
    before: { val: () => before },
    after: { val: () => after },
  });

  it('listens on the invoice recipients with retries enabled', () => {
    expect(mockCapturedOptions).toEqual({
      region: '{{ params.RTDB_REGION }}',
      instance: '{{ params.RTDB_INSTANCE }}',
      ref: '/settings/invoiceRecipients',
      retry: true,
    });
  });

  it('does nothing when before and after are equal', async () => {
    const change = makeChange([{ name: 'A', emails: [] }], [{ name: 'A', emails: [] }]);
    await mockCapturedHandler({ data: change });
    expect(mockAdminDbRef).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('does nothing when no customs declaration settings exist', async () => {
    customsSettings = null;
    const change = makeChange([{ name: 'A' }], [{ name: 'B' }]);
    await mockCapturedHandler({ data: change });
    expect(global.fetch).not.toHaveBeenCalled();
    expect(statusSet).not.toHaveBeenCalled();
  });

  it('does nothing when customs settings have no baseUrl', async () => {
    customsSettings = { aerodrome: 'LSZT' };
    const change = makeChange([{ name: 'A' }], [{ name: 'B' }]);
    await mockCapturedHandler({ data: change });
    expect(global.fetch).not.toHaveBeenCalled();
    expect(statusSet).not.toHaveBeenCalled();
  });

  it('sends PUT request with the current recipient data when settings are present', async () => {
    global.fetch.mockResolvedValue({ ok: true, status: 200, json: jest.fn().mockResolvedValue({}) });

    currentRecipients = [
      { name: 'Alice', emails: ['alice@example.com'] },
      { name: 'Bob', emails: ['bob@example.com', 'bob2@example.com'] },
    ];
    const change = makeChange([{ name: 'Old' }], currentRecipients);
    await mockCapturedHandler({ data: change });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://customs.example.com/api/invoice-recipients?ad=LSZT',
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          Authorization: 'Bearer tok123',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify([
          { name: 'Alice', emails: ['alice@example.com'] },
          { name: 'Bob', emails: ['bob@example.com', 'bob2@example.com'] },
        ]),
      })
    );
  });

  it('pushes the value currently stored rather than the event data', async () => {
    global.fetch.mockResolvedValue({ ok: true, status: 200, json: jest.fn().mockResolvedValue({}) });

    currentRecipients = [{ name: 'Newest', emails: ['n@example.com'] }];
    const change = makeChange([{ name: 'Old' }], [{ name: 'Stale', emails: [] }]);
    await mockCapturedHandler({ data: change });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: JSON.stringify([{ name: 'Newest', emails: ['n@example.com'] }]),
      })
    );
  });

  it('sends an empty array when the recipients were deleted', async () => {
    global.fetch.mockResolvedValue({ ok: true, status: 200, json: jest.fn().mockResolvedValue({}) });

    const change = makeChange([{ name: 'Old' }], null);
    await mockCapturedHandler({ data: change });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ body: JSON.stringify([]) })
    );
  });

  it('records a successful sync', async () => {
    global.fetch.mockResolvedValue({ ok: true, status: 200, json: jest.fn().mockResolvedValue({}) });

    currentRecipients = [{ name: 'B' }];
    await mockCapturedHandler({ data: makeChange([{ name: 'A' }], currentRecipients) });

    expect(statusSet).toHaveBeenCalledWith({ status: 'ok', timestamp: expect.any(String) });
  });

  it('logs and records an error without throwing when the customs app rejects the request', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: jest.fn().mockResolvedValue({ error: 'Not authorized' }),
    });

    const change = makeChange([{ name: 'A' }], [{ name: 'B' }]);
    await expect(mockCapturedHandler({ data: change })).resolves.toBeUndefined();

    expect(mockLogger.error).toHaveBeenCalledWith(
      'Failed to update the invoice recipients of the customs app',
      expect.anything()
    );
    expect(statusSet).toHaveBeenCalledWith({
      status: 'error',
      httpStatus: 401,
      timestamp: expect.any(String),
    });
  });

  it('throws on a server error so the event is retried', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 503,
      json: jest.fn().mockRejectedValue(new SyntaxError('Unexpected token <')),
    });

    const change = makeChange([{ name: 'A' }], [{ name: 'B' }]);
    await expect(mockCapturedHandler({ data: change })).rejects.toThrow('HTTP 503');

    expect(statusSet).toHaveBeenCalledWith({
      status: 'error',
      httpStatus: 503,
      timestamp: expect.any(String),
    });
  });

  describe('buildBody', () => {
    it('maps recipients to name and emails', () => {
      expect(buildBody([
        { name: 'Alice', emails: ['alice@example.com'] },
        { name: 'Bob' },
      ])).toEqual([
        { name: 'Alice', emails: ['alice@example.com'] },
        { name: 'Bob', emails: [] },
      ]);
    });

    it('returns an empty array for null', () => {
      expect(buildBody(null)).toEqual([]);
    });

    it('skips empty entries of a sparse list', () => {
      expect(buildBody({ 0: { name: 'A' }, 2: { name: 'C' } })).toEqual([
        { name: 'A', emails: [] },
        { name: 'C', emails: [] },
      ]);
      expect(buildBody([{ name: 'A' }, null])).toEqual([{ name: 'A', emails: [] }]);
    });
  });
});
