global.__FIREBASE_PROJECT_ID__ = 'test-project';

jest.mock('@simplewebauthn/browser', () => ({
  startRegistration: jest.fn(),
  startAuthentication: jest.fn(),
}));

jest.mock('./firebase', () => ({
  getIdToken: jest.fn(),
}));

import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import { getIdToken } from './firebase';
import {
  registerPasskey,
  authenticateWithPasskey,
  removePasskey,
  isPasskeySupported,
} from './webauthn';

describe('util/webauthn', () => {
  let originalFetch;

  beforeEach(() => {
    jest.clearAllMocks();
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const okResponse = (body) => ({
    ok: true,
    json: jest.fn().mockResolvedValue(body),
  });

  const errorResponse = (status, body) => ({
    ok: false,
    status,
    json: jest.fn().mockResolvedValue(body),
  });

  describe('registerPasskey', () => {
    it('orchestrates options → ceremony → verify and returns summary', async () => {
      (getIdToken as jest.Mock).mockResolvedValue('id-token-xyz');
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        configurable: true,
      });

      global.fetch = jest.fn()
        .mockResolvedValueOnce(okResponse({
          options: { challenge: 'server-challenge' },
          challengeKey: 'ck1',
        }))
        .mockResolvedValueOnce(okResponse({
          success: true,
          credentialId: 'cred-1',
          deviceName: 'Mac',
          createdAt: 1234567890,
        }));

      (startRegistration as jest.Mock).mockResolvedValue({
        id: 'cred-1',
        response: { transports: ['internal'] },
      });

      const result = await registerPasskey();

      expect(result).toEqual({
        credentialId: 'cred-1',
        deviceName: 'Mac',
        createdAt: 1234567890,
      });

      const firstCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(firstCall[0]).toContain('generateWebauthnRegistrationOptions');
      expect(firstCall[1].headers.Authorization).toBe('Bearer id-token-xyz');

      expect(startRegistration).toHaveBeenCalledWith({
        optionsJSON: { challenge: 'server-challenge' },
      });

      const secondCall = (global.fetch as jest.Mock).mock.calls[1];
      expect(secondCall[0]).toContain('verifyWebauthnRegistration');
      const body = JSON.parse(secondCall[1].body);
      expect(body).toEqual({
        challengeKey: 'ck1',
        attestationResponse: { id: 'cred-1', response: { transports: ['internal'] } },
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      });
      expect(secondCall[1].headers.Authorization).toBe('Bearer id-token-xyz');
    });

    it('throws with server error message when verify fails', async () => {
      (getIdToken as jest.Mock).mockResolvedValue('id-token-xyz');
      global.fetch = jest.fn()
        .mockResolvedValueOnce(okResponse({
          options: { challenge: 'c' },
          challengeKey: 'k',
        }))
        .mockResolvedValueOnce(errorResponse(400, { error: 'Registration verification failed' }));
      (startRegistration as jest.Mock).mockResolvedValue({ id: 'c1', response: {} });

      await expect(registerPasskey()).rejects.toThrow('Registration verification failed');
    });

    it('propagates browser API errors', async () => {
      (getIdToken as jest.Mock).mockResolvedValue('id-token');
      global.fetch = jest.fn()
        .mockResolvedValueOnce(okResponse({ options: {}, challengeKey: 'k' }));
      (startRegistration as jest.Mock).mockRejectedValue(new Error('User cancelled'));

      await expect(registerPasskey()).rejects.toThrow('User cancelled');
    });
  });

  describe('authenticateWithPasskey', () => {
    it('returns token on success with email', async () => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce(okResponse({
          options: { challenge: 'c' },
          challengeKey: 'k2',
        }))
        .mockResolvedValueOnce(okResponse({ token: 'custom-token-abc' }));
      (startAuthentication as jest.Mock).mockResolvedValue({ id: 'cred-1' });

      const result = await authenticateWithPasskey('user@example.com');

      expect(result).toBe('custom-token-abc');
      const firstCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(firstCall[0]).toContain('generateWebauthnAuthenticationOptions');
      expect(JSON.parse(firstCall[1].body)).toEqual({ email: 'user@example.com' });
      // No Authorization header on the public auth path
      expect(firstCall[1].headers.Authorization).toBeUndefined();
      expect(startAuthentication).toHaveBeenCalledWith({ optionsJSON: { challenge: 'c' } });

      const secondCall = (global.fetch as jest.Mock).mock.calls[1];
      const body = JSON.parse(secondCall[1].body);
      expect(body).toEqual({ challengeKey: 'k2', assertionResponse: { id: 'cred-1' } });
    });

    it('omits email from request body when not provided (usernameless)', async () => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce(okResponse({ options: {}, challengeKey: 'k' }))
        .mockResolvedValueOnce(okResponse({ token: 't' }));
      (startAuthentication as jest.Mock).mockResolvedValue({ id: 'c' });

      await authenticateWithPasskey();

      const firstBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(firstBody).toEqual({});
    });

    it('throws when server does not return a token', async () => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce(okResponse({ options: {}, challengeKey: 'k' }))
        .mockResolvedValueOnce(okResponse({}));
      (startAuthentication as jest.Mock).mockResolvedValue({ id: 'c' });

      await expect(authenticateWithPasskey()).rejects.toThrow('token');
    });

    it('surfaces server error message on failure', async () => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce(okResponse({ options: {}, challengeKey: 'k' }))
        .mockResolvedValueOnce(errorResponse(400, { error: 'Authentication verification failed' }));
      (startAuthentication as jest.Mock).mockResolvedValue({ id: 'c' });

      await expect(authenticateWithPasskey()).rejects.toThrow('Authentication verification failed');
    });
  });

  describe('removePasskey', () => {
    it('posts credentialId with bearer token', async () => {
      (getIdToken as jest.Mock).mockResolvedValue('id-token');
      global.fetch = jest.fn().mockResolvedValue(okResponse({ success: true }));

      await removePasskey('cred-xyz');

      const call = (global.fetch as jest.Mock).mock.calls[0];
      expect(call[0]).toContain('removeWebauthnCredential');
      expect(call[1].headers.Authorization).toBe('Bearer id-token');
      expect(JSON.parse(call[1].body)).toEqual({ credentialId: 'cred-xyz' });
    });
  });

  describe('isPasskeySupported', () => {
    it('returns true when PublicKeyCredential is defined', () => {
      (window as any).PublicKeyCredential = function() {};
      expect(isPasskeySupported()).toBe(true);
      delete (window as any).PublicKeyCredential;
    });

    it('returns false when PublicKeyCredential is undefined', () => {
      delete (window as any).PublicKeyCredential;
      expect(isPasskeySupported()).toBe(false);
    });
  });

  it('does not import firebase/auth (decoupling guarantee)', () => {
    // Read the source file and assert no firebase/auth import exists.
    const fs = require('fs');
    const path = require('path');
    const src = fs.readFileSync(path.join(__dirname, 'webauthn.ts'), 'utf8');
    expect(src).not.toMatch(/from ['"]firebase\/auth['"]/);
    expect(src).not.toMatch(/from ['"]firebase\/app['"]/);
    expect(src).not.toMatch(/getAuth\(/);
  });
});
