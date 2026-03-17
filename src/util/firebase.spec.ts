global.__FIREBASE_API_KEY__ = 'test-api-key';
global.__FIREBASE_DATABASE_URL__ = 'https://test-db.firebaseio.com';
global.__FIREBASE_DATABASE_NAME__ = 'test-db';
global.__FIREBASE_PROJECT_ID__ = 'test-project';

jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
}));

jest.mock('firebase/database', () => ({
  getDatabase: jest.fn(),
  ref: jest.fn(),
  query: jest.fn(),
  orderByKey: jest.fn(),
  get: jest.fn(),
  push: jest.fn(),
  remove: jest.fn(),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  onAuthStateChanged: jest.fn(),
  signInWithCustomToken: jest.fn(),
  signOut: jest.fn(),
}));

import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, query, orderByKey, get } from 'firebase/database';
import {
  getAuth,
  onAuthStateChanged,
  signInWithCustomToken,
  signOut,
} from 'firebase/auth';
import firebaseDefault, {
  watchAuthState,
  authenticate,
  requestSignInCode,
  verifyOtpCode,
  unauth,
  loadValue,
  getIdToken,
} from './firebase';

describe('util/firebase', () => {
  let mockDb;
  let mockRef;
  let mockQueryRef;
  let mockAuth;

  beforeEach(() => {
    mockDb = { _type: 'db' };
    mockRef = { _type: 'ref' };
    mockQueryRef = { _type: 'queryRef' };
    mockAuth = {
      currentUser: { getIdToken: jest.fn() },
    };

    jest.clearAllMocks();
    (getApps as jest.Mock).mockReturnValue([]);
    (getDatabase as jest.Mock).mockReturnValue(mockDb);
    (ref as jest.Mock).mockReturnValue(mockRef);
    (query as jest.Mock).mockReturnValue(mockQueryRef);
    (orderByKey as jest.Mock).mockReturnValue('orderByKey_constraint');
    (getAuth as jest.Mock).mockReturnValue(mockAuth);
  });

  describe('default export (firebase function)', () => {
    it('returns a ref when called with a path', () => {
      const result = firebaseDefault('/test');
      expect(ref).toHaveBeenCalledWith(mockDb, '/test');
      expect(result).toBe(mockRef);
    });

    it('returns root ref when called without path', () => {
      const result = (firebaseDefault as any)();
      expect(ref).toHaveBeenCalledWith(mockDb, '/');
      expect(result).toBe(mockRef);
    });

    it('returns root ref when null path provided', () => {
      const result = firebaseDefault(null);
      expect(ref).toHaveBeenCalledWith(mockDb, '/');
      expect(result).toBe(mockRef);
    });

    it('calls initializeApp when apps list is empty', () => {
      (getApps as jest.Mock).mockReturnValue([]);
      firebaseDefault('/test');
      expect(initializeApp).toHaveBeenCalled();
    });

    it('does not call initializeApp when already initialized', () => {
      (getApps as jest.Mock).mockReturnValue([{}]);
      firebaseDefault('/test');
      expect(initializeApp).not.toHaveBeenCalled();
    });
  });

  describe('watchAuthState', () => {
    it('calls onAuthStateChanged with auth instance and callback', () => {
      const cb = jest.fn();
      watchAuthState(cb);
      expect(onAuthStateChanged).toHaveBeenCalledWith(mockAuth, cb);
    });
  });

  describe('authenticate', () => {
    it('resolves with user when signInWithCustomToken succeeds', async () => {
      const mockUser = { uid: 'user123' };
      (signInWithCustomToken as jest.Mock).mockResolvedValue(mockUser);

      const result = await authenticate('valid-token');
      expect(result).toBe(mockUser);
      expect(signInWithCustomToken).toHaveBeenCalledWith(mockAuth, 'valid-token');
    });

    it('rejects when signInWithCustomToken fails', async () => {
      (signInWithCustomToken as jest.Mock).mockRejectedValue(new Error('auth error'));
      await expect(authenticate('bad-token')).rejects.toThrow('auth error');
    });
  });

  describe('requestSignInCode', () => {
    let originalFetch;

    beforeEach(() => {
      originalFetch = global.fetch;
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('resolves with code and email on success', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          code: '123456',
          email: 'user@example.com',
        }),
      };
      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      const result = await requestSignInCode('user@example.com');
      expect(result).toEqual({
        code: '123456',
        email: 'user@example.com',
      });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('generateSignInCode'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('rejects when response is not ok with error from body', async () => {
      const mockResponse = {
        ok: false,
        json: jest.fn().mockResolvedValue({ error: 'Invalid email' }),
      };
      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      await expect(requestSignInCode('bad@example.com'))
        .rejects.toThrow('Invalid email');
    });

    it('uses fallback error message when response has no error field', async () => {
      const mockResponse = {
        ok: false,
        json: jest.fn().mockResolvedValue({}),
      };
      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      await expect(requestSignInCode('user@example.com'))
        .rejects.toThrow('Failed to generate sign-in code');
    });

    it('rejects when fetch throws', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      await expect(requestSignInCode('user@example.com'))
        .rejects.toThrow('Network error');
    });
  });

  describe('verifyOtpCode', () => {
    let originalFetch;

    beforeEach(() => {
      originalFetch = global.fetch;
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('resolves with token on success', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ token: 'custom-token-abc' }),
      };
      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      const result = await verifyOtpCode('user@example.com', '123456');
      expect(result).toBe('custom-token-abc');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('verifySignInCode'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('rejects when response is not ok', async () => {
      const mockResponse = {
        ok: false,
        json: jest.fn().mockResolvedValue({ error: 'Invalid or expired code' }),
      };
      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      await expect(verifyOtpCode('user@example.com', '000000'))
        .rejects.toThrow('Invalid or expired code');
    });

    it('uses fallback error message when response has no error field', async () => {
      const mockResponse = {
        ok: false,
        json: jest.fn().mockResolvedValue({}),
      };
      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      await expect(verifyOtpCode('user@example.com', '000000'))
        .rejects.toThrow('Invalid or expired code');
    });
  });

  describe('unauth', () => {
    it('calls signOut with auth instance', () => {
      unauth();
      expect(signOut).toHaveBeenCalledWith(mockAuth);
    });
  });

  describe('loadValue', () => {
    it('resolves with snapshot from firebase ref', async () => {
      const mockSnapshot = { val: () => ({ data: 'test' }) };
      (get as jest.Mock).mockResolvedValue(mockSnapshot);

      const result = await loadValue('/some/path');
      expect(result).toBe(mockSnapshot);
      expect(ref).toHaveBeenCalledWith(mockDb, '/some/path');
      expect(orderByKey).toHaveBeenCalled();
      expect(query).toHaveBeenCalledWith(mockRef, 'orderByKey_constraint');
      expect(get).toHaveBeenCalledWith(mockQueryRef);
    });
  });

  describe('getIdToken', () => {
    it('calls currentUser.getIdToken()', () => {
      const mockToken = Promise.resolve('id-token');
      mockAuth.currentUser.getIdToken.mockReturnValue(mockToken);

      const result = getIdToken();
      expect(mockAuth.currentUser.getIdToken).toHaveBeenCalled();
      expect(result).toBe(mockToken);
    });
  });
});
