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
  isSignInWithEmailLink: jest.fn(),
  signInWithEmailLink: jest.fn(),
  signOut: jest.fn(),
}));

import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, query, orderByKey, get } from 'firebase/database';
import {
  getAuth,
  onAuthStateChanged,
  signInWithCustomToken,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut,
} from 'firebase/auth';
import firebaseDefault, {
  watchAuthState,
  authenticate,
  authenticateEmail,
  isSignInWithEmail,
  signInWithEmail,
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
    getApps.mockReturnValue([]);
    getDatabase.mockReturnValue(mockDb);
    ref.mockReturnValue(mockRef);
    query.mockReturnValue(mockQueryRef);
    orderByKey.mockReturnValue('orderByKey_constraint');
    getAuth.mockReturnValue(mockAuth);
  });

  describe('default export (firebase function)', () => {
    it('returns a ref when called with a path', () => {
      const result = firebaseDefault('/test');
      expect(ref).toHaveBeenCalledWith(mockDb, '/test');
      expect(result).toBe(mockRef);
    });

    it('returns root ref when called without path', () => {
      const result = firebaseDefault();
      expect(ref).toHaveBeenCalledWith(mockDb, '/');
      expect(result).toBe(mockRef);
    });

    it('returns root ref when null path provided', () => {
      const result = firebaseDefault(null);
      expect(ref).toHaveBeenCalledWith(mockDb, '/');
      expect(result).toBe(mockRef);
    });

    it('calls initializeApp when apps list is empty', () => {
      getApps.mockReturnValue([]);
      firebaseDefault('/test');
      expect(initializeApp).toHaveBeenCalled();
    });

    it('does not call initializeApp when already initialized', () => {
      getApps.mockReturnValue([{}]);
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
      signInWithCustomToken.mockResolvedValue(mockUser);

      const result = await authenticate('valid-token');
      expect(result).toBe(mockUser);
      expect(signInWithCustomToken).toHaveBeenCalledWith(mockAuth, 'valid-token');
    });

    it('rejects when signInWithCustomToken fails', async () => {
      signInWithCustomToken.mockRejectedValue(new Error('auth error'));
      await expect(authenticate('bad-token')).rejects.toThrow('auth error');
    });
  });

  describe('authenticateEmail', () => {
    let originalFetch;

    beforeEach(() => {
      originalFetch = global.fetch;
    });

    afterEach(() => {
      global.fetch = originalFetch;
      localStorage.clear();
    });

    it('resolves with signInLink and email on success', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          signInLink: 'https://example.com/link',
          email: 'user@example.com',
        }),
      };
      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      const result = await authenticateEmail('user@example.com', true);
      expect(result).toEqual({
        signInLink: 'https://example.com/link',
        email: 'user@example.com',
      });
      expect(localStorage.getItem('emailForSignIn')).toBe('user@example.com');
      expect(localStorage.getItem('isLocalSignIn')).toBe('true');
    });

    it('rejects when response is not ok with error from body', async () => {
      const mockResponse = {
        ok: false,
        json: jest.fn().mockResolvedValue({ error: 'Not found' }),
      };
      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      await expect(authenticateEmail('user@example.com', false))
        .rejects.toThrow('Not found');
    });

    it('rejects when fetch throws', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      await expect(authenticateEmail('user@example.com', false))
        .rejects.toThrow('Network error');
    });

    it('uses fallback error message when response has no error field', async () => {
      const mockResponse = {
        ok: false,
        json: jest.fn().mockResolvedValue({}),
      };
      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      await expect(authenticateEmail('user@example.com', false))
        .rejects.toThrow('Failed to generate sign-in link');
    });
  });

  describe('isSignInWithEmail', () => {
    it('calls isSignInWithEmailLink with auth and current href', () => {
      isSignInWithEmailLink.mockReturnValue(true);

      const result = isSignInWithEmail();
      expect(isSignInWithEmailLink).toHaveBeenCalledWith(
        mockAuth,
        window.location.href
      );
      expect(result).toBe(true);
    });

    it('returns false when not a sign-in link', () => {
      isSignInWithEmailLink.mockReturnValue(false);
      expect(isSignInWithEmail()).toBe(false);
    });
  });

  describe('signInWithEmail', () => {
    it('calls signInWithEmailLink and removes localStorage item', async () => {
      localStorage.setItem('emailForSignIn', 'test@example.com');
      signInWithEmailLink.mockResolvedValue({});

      await signInWithEmail();
      expect(signInWithEmailLink).toHaveBeenCalledWith(
        mockAuth,
        'test@example.com',
        window.location.href
      );
      expect(localStorage.getItem('emailForSignIn')).toBeNull();
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
      get.mockResolvedValue(mockSnapshot);

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
