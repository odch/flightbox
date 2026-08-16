'use strict';

let capturedHandler;

jest.mock('firebase-functions/v2/https', () => ({
  onRequest: jest.fn((opts, handler) => {
    capturedHandler = handler;
    return handler;
  }),
}));

// cors middleware: immediately invoke the wrapped callback.
jest.mock('cors', () => () => (req, res, cb) => cb());

const mockCreateCustomToken = jest.fn().mockResolvedValue('minted-token');

jest.mock('firebase-admin', () => ({
  auth: jest.fn(() => ({ createCustomToken: mockCreateCustomToken })),
}));

const mockKioskMode = jest.fn();
jest.mock('./modes', () => ({ kiosk_token: mockKioskMode }));

require('./index');

const makeRes = () => ({
  send: jest.fn(),
  status: jest.fn().mockReturnThis(),
});

describe('functions/auth (token dispatcher)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('mints a custom token with no custom claims (no ip claim)', async () => {
    mockKioskMode.mockResolvedValue('kiosk');
    const req = { method: 'POST', body: { mode: 'kiosk_token', token: 't' }, headers: {} };
    const res = makeRes();

    await capturedHandler(req, res);

    expect(mockCreateCustomToken).toHaveBeenCalledTimes(1);
    // Exactly one argument: the uid. No additionalClaims object.
    expect(mockCreateCustomToken.mock.calls[0]).toEqual(['kiosk']);
    expect(res.send).toHaveBeenCalledWith({ token: 'minted-token' });
  });

  it('returns a null token when the mode resolves without a uid', async () => {
    mockKioskMode.mockResolvedValue(null);
    const req = { method: 'POST', body: { mode: 'kiosk_token', token: 'bad' }, headers: {} };
    const res = makeRes();

    await capturedHandler(req, res);

    expect(mockCreateCustomToken).not.toHaveBeenCalled();
    expect(res.send).toHaveBeenCalledWith({ token: null });
  });

  it('rejects a non-POST method with 405', async () => {
    const req = { method: 'GET', body: {}, headers: {} };
    const res = makeRes();

    await capturedHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
  });
});
