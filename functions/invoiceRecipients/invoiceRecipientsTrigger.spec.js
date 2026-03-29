'use strict';

let capturedHandler;

jest.mock('firebase-functions', () => {
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

describe('functions/invoiceRecipients/invoiceRecipientsTrigger', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    capturedHandler = null;

    jest.mock('firebase-functions', () => {
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

    require('./invoiceRecipientsTrigger');
  });

  const makeChange = (before, after) => ({
    before: { val: () => before },
    after: { val: () => after },
  });

  it('does nothing when before and after are equal', async () => {
    const change = makeChange([{ name: 'A', emails: [] }], [{ name: 'A', emails: [] }]);
    await capturedHandler(change, {});
    expect(mockAdminDbRef).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('does nothing when no customs declaration settings exist', async () => {
    mockAdminDbRef.mockReturnValue({
      once: jest.fn().mockResolvedValue({ val: () => null }),
    });
    const change = makeChange([{ name: 'A' }], [{ name: 'B' }]);
    await capturedHandler(change, {});
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('does nothing when customs settings have no baseUrl', async () => {
    mockAdminDbRef.mockReturnValue({
      once: jest.fn().mockResolvedValue({ val: () => ({ aerodrome: 'LSZT' }) }),
    });
    const change = makeChange([{ name: 'A' }], [{ name: 'B' }]);
    await capturedHandler(change, {});
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('sends PUT request with recipient data when settings are present', async () => {
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

    const after = [
      { name: 'Alice', emails: ['alice@example.com'] },
      { name: 'Bob', emails: ['bob@example.com', 'bob2@example.com'] },
    ];
    const change = makeChange([{ name: 'Old' }], after);
    await capturedHandler(change, {});

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

    const change = makeChange([{ name: 'Old' }], null);
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
      json: jest.fn().mockResolvedValue({ error: 'Not authorized' }),
    });

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const change = makeChange([{ name: 'A' }], [{ name: 'B' }]);
    await capturedHandler(change, {});

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to update the invoice recipients of the customs app',
      expect.anything()
    );
    consoleSpy.mockRestore();
  });
});
