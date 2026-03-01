// Set up globals required by firebase.js before importing
global.__FIREBASE_API_KEY__ = 'test-api-key';
global.__FIREBASE_DATABASE_URL__ = 'https://test-db.firebaseio.com';
global.__FIREBASE_DATABASE_NAME__ = 'test-db';
global.__FIREBASE_PROJECT_ID__ = 'test-project';

jest.mock('firebase/compat/app', () => {
  const mockRef = {
    orderByKey: jest.fn().mockReturnThis(),
    once: jest.fn(),
  };

  const mockDb = {
    ref: jest.fn(() => mockRef),
  };

  const mockAuth = {
    onAuthStateChanged: jest.fn(),
    signInWithCustomToken: jest.fn(),
    signInWithEmailLink: jest.fn(),
    isSignInWithEmailLink: jest.fn(),
    signOut: jest.fn(),
    currentUser: {
      getIdToken: jest.fn(),
    },
  };

  const apps = [];

  const Firebase = {
    _mockRef: mockRef,
    _mockDb: mockDb,
    _mockAuth: mockAuth,
    get apps() {
      return apps;
    },
    _apps: apps,
    initializeApp: jest.fn(() => {
      apps.push({});
    }),
    database: jest.fn(() => mockDb),
    auth: jest.fn(() => mockAuth),
  };

  return Firebase;
});

jest.mock('firebase/compat/auth', () => ({}));
jest.mock('firebase/compat/database', () => ({}));

import Firebase from 'firebase/compat/app';
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
  let mockRef;
  let mockDb;
  let mockAuth;

  beforeEach(() => {
    mockRef = Firebase._mockRef;
    mockDb = Firebase._mockDb;
    mockAuth = Firebase._mockAuth;
    jest.clearAllMocks();
    // Reset apps array so initialize() runs
    Firebase._apps.length = 0;
  });

  describe('default export (firebase function)', () => {
    it('returns a ref when called without callback', () => {
      const result = firebaseDefault('/test');
      expect(Firebase.database).toHaveBeenCalled();
      expect(mockDb.ref).toHaveBeenCalledWith('/test');
      expect(result).toBe(mockRef);
    });

    it('calls callback with null error and ref when callback provided', () => {
      const callback = jest.fn();
      firebaseDefault('/test/path', callback);
      expect(callback).toHaveBeenCalledWith(null, mockRef);
    });

    it('uses root path when path argument is a function', () => {
      const callback = jest.fn();
      firebaseDefault(callback);
      expect(mockDb.ref).toHaveBeenCalledWith('/');
      expect(callback).toHaveBeenCalledWith(null, mockRef);
    });

    it('returns ref when null path provided without callback', () => {
      // When path is null (!path is true), callback=path=null and path='/'
      // Since callback is null, the function returns the ref
      const result = firebaseDefault(null);
      expect(mockDb.ref).toHaveBeenCalledWith('/');
      expect(result).toBe(mockRef);
    });

    it('calls initializeApp when apps list is empty', () => {
      Firebase._apps.length = 0;
      firebaseDefault('/test');
      expect(Firebase.initializeApp).toHaveBeenCalled();
    });

    it('does not call initializeApp when already initialized', () => {
      Firebase._apps.push({});
      firebaseDefault('/test');
      expect(Firebase.initializeApp).not.toHaveBeenCalled();
    });
  });

  describe('watchAuthState', () => {
    it('calls Firebase.auth().onAuthStateChanged with callback', () => {
      const cb = jest.fn();
      watchAuthState(cb);
      expect(Firebase.auth).toHaveBeenCalled();
      expect(mockAuth.onAuthStateChanged).toHaveBeenCalledWith(cb);
    });
  });

  describe('authenticate', () => {
    it('resolves with user when signInWithCustomToken succeeds', async () => {
      const mockUser = { uid: 'user123' };
      mockAuth.signInWithCustomToken.mockResolvedValue(mockUser);

      const result = await authenticate('valid-token');
      expect(result).toBe(mockUser);
      expect(mockAuth.signInWithCustomToken).toHaveBeenCalledWith('valid-token');
    });

    it('rejects when signInWithCustomToken fails', async () => {
      mockAuth.signInWithCustomToken.mockRejectedValue(new Error('auth error'));
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
    it('calls Firebase.auth().isSignInWithEmailLink with current href', () => {
      mockAuth.isSignInWithEmailLink.mockReturnValue(true);

      const result = isSignInWithEmail();
      expect(mockAuth.isSignInWithEmailLink).toHaveBeenCalledWith(
        window.location.href
      );
      expect(result).toBe(true);
    });

    it('returns false when not a sign-in link', () => {
      mockAuth.isSignInWithEmailLink.mockReturnValue(false);
      expect(isSignInWithEmail()).toBe(false);
    });
  });

  describe('signInWithEmail', () => {
    it('calls signInWithEmailLink and removes localStorage item', async () => {
      localStorage.setItem('emailForSignIn', 'test@example.com');
      mockAuth.signInWithEmailLink.mockResolvedValue({});

      await signInWithEmail();
      expect(mockAuth.signInWithEmailLink).toHaveBeenCalledWith(
        'test@example.com',
        window.location.href
      );
      expect(localStorage.getItem('emailForSignIn')).toBeNull();
    });
  });

  describe('unauth', () => {
    it('calls Firebase.auth().signOut()', () => {
      unauth();
      expect(mockAuth.signOut).toHaveBeenCalled();
    });
  });

  describe('loadValue', () => {
    it('resolves with snapshot from firebase ref', async () => {
      const mockSnapshot = { val: () => ({ data: 'test' }) };
      mockRef.once.mockImplementation((event, cb) => cb(mockSnapshot));

      const result = await loadValue('/some/path');
      expect(result).toBe(mockSnapshot);
      expect(mockRef.orderByKey).toHaveBeenCalled();
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
