/** @jest-environment node */
'use strict';

jest.mock('firebase-functions/logger', () => ({ error: jest.fn(), info: jest.fn(), warn: jest.fn() }));

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const logger = require('firebase-functions/logger');
const { createLoginTokenVerifier, LoginTokenRejected } = require('./loginTokens');
const { validateCentralLogin } = require('./centralLoginConfig');

const CONFIG = Object.freeze({
  issuer: 'https://login.example.ch',
  jwksUri: 'https://login.example.ch/jwks',
  audience: 'flightbox-lsze-test',
});
const SUB = '7f3c1a52-0d7e-4c43-9a55-2a1f1a0e8b11';

const keyPair = () => crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
const publicJwk = (publicKey, kid) => ({ ...publicKey.export({ format: 'jwk' }), kid, alg: 'ES256', use: 'sig' });

function sign(privateKey, claims = {}, { kid = 'k1', typ = 'at+jwt', alg = 'ES256', expiresIn = 300 } = {}) {
  return jwt.sign(
    {
      sub: SUB,
      email: 'Pilot@Example.com',
      email_verified: true,
      scope: 'movements:write',
      client_id: 'mcp-hub',
      ...claims,
    },
    privateKey,
    {
      algorithm: alg,
      issuer: CONFIG.issuer,
      audience: CONFIG.audience,
      expiresIn,
      header: { typ, kid, alg },
    }
  );
}

describe('functions', () => {
  describe('api/http/loginTokens', () => {
    let keys;
    let jwks;
    let fetchImpl;
    let clock;
    let verifier;

    beforeEach(() => {
      jest.clearAllMocks();
      keys = keyPair();
      jwks = { keys: [publicJwk(keys.publicKey, 'k1')] };
      clock = Date.now();
      fetchImpl = jest.fn(async () => ({ ok: true, status: 200, json: async () => jwks }));
      verifier = createLoginTokenVerifier(CONFIG, { fetchImpl, now: () => clock });
    });

    const rejection = async token => {
      const error = await verifier.verify(token).then(() => null, e => e);
      expect(error).toBeInstanceOf(LoginTokenRejected);
      return error.message;
    };

    it('is null without config', () => {
      expect(createLoginTokenVerifier(undefined)).toBeNull();
      expect(createLoginTokenVerifier(null)).toBeNull();
    });

    it('is null and logs for an invalid config', () => {
      expect(createLoginTokenVerifier({ ...CONFIG, issuer: 'http://login.example.ch' })).toBeNull();
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Invalid centralLogin config'));
    });

    it('accepts a token of the login and returns the subject and lower-cased e-mail', async () => {
      const token = sign(keys.privateKey);
      expect(verifier.isLoginToken(token)).toBe(true);
      await expect(verifier.verify(token)).resolves.toEqual({ sub: SUB, email: 'pilot@example.com', scopes: ['movements:write'] });
      expect(fetchImpl).toHaveBeenCalledWith(CONFIG.jwksUri, expect.objectContaining({ signal: expect.anything() }));
    });

    it('recognises only tokens that claim the login as issuer', () => {
      const firebaseLike = jwt.sign({ iss: 'https://securetoken.google.com/lsze-test', sub: 'u1' }, 'secret');
      expect(verifier.isLoginToken(firebaseLike)).toBe(false);
      expect(verifier.isLoginToken('token-pilot-uid')).toBe(false);
      expect(verifier.isLoginToken('a.b.c')).toBe(false);
      expect(verifier.isLoginToken('')).toBe(false);
    });

    it('rejects tokens for another audience or issuer', async () => {
      expect(await rejection(jwt.sign({ sub: SUB }, keys.privateKey, {
        algorithm: 'ES256', issuer: CONFIG.issuer, audience: 'flightbox-lszt-prod', expiresIn: 300, header: { typ: 'at+jwt', kid: 'k1', alg: 'ES256' },
      }))).toMatch(/^invalid: jwt audience invalid/);
      expect(await rejection(jwt.sign({ sub: SUB }, keys.privateKey, {
        algorithm: 'ES256', issuer: 'https://evil.example', audience: CONFIG.audience, expiresIn: 300, header: { typ: 'at+jwt', kid: 'k1', alg: 'ES256' },
      }))).toMatch(/^invalid: jwt issuer invalid/);
    });

    it('rejects expired tokens and tokens that live too long', async () => {
      expect(await rejection(sign(keys.privateKey, {}, { expiresIn: -60 }))).toBe('expired');
      expect(await rejection(sign(keys.privateKey, {}, { expiresIn: 2 * 60 * 60 }))).toBe('lifetime');
    });

    it('rejects other algorithms, types and missing key ids', async () => {
      const publicPem = keys.publicKey.export({ format: 'pem', type: 'spki' });
      expect(await rejection(sign(publicPem, {}, { alg: 'HS256' }))).toBe('algorithm');
      const unsigned = `${Buffer.from(JSON.stringify({ alg: 'none', typ: 'at+jwt', kid: 'k1' })).toString('base64url')}.${
        Buffer.from(JSON.stringify({ iss: CONFIG.issuer, aud: CONFIG.audience, sub: SUB })).toString('base64url')}.`;
      expect(await rejection(unsigned)).toBe('algorithm');
      expect(await rejection(sign(keys.privateKey, {}, { typ: 'JWT' }))).toBe('type');
      expect(await rejection(sign(keys.privateKey, {}, { kid: '' }))).toBe('kid');
      expect(await rejection('not-a-jwt')).toBe('malformed');
    });

    it('rejects a signature of another key, also under a known kid', async () => {
      const other = keyPair();
      expect(await rejection(sign(other.privateKey))).toMatch(/^invalid: invalid signature/);
      expect(await rejection(sign(other.privateKey, {}, { kid: 'unknown' }))).toBe('unknown key');
    });

    it('requires a verified e-mail, a subject and the movements scope', async () => {
      expect(await rejection(sign(keys.privateKey, { email: undefined }))).toBe('no verified e-mail');
      expect(await rejection(sign(keys.privateKey, { email_verified: false }))).toBe('no verified e-mail');
      expect(await rejection(sign(keys.privateKey, { sub: 'a/b' }))).toBe('subject');
      expect(await rejection(sign(keys.privateKey, { scope: 'openid email' }))).toBe('scope');
    });

    it('accepts movements:read and returns only the movement scopes', async () => {
      await expect(verifier.verify(sign(keys.privateKey, { scope: 'movements:read' })))
        .resolves.toEqual({ sub: SUB, email: 'pilot@example.com', scopes: ['movements:read'] });
      await expect(verifier.verify(sign(keys.privateKey, { scope: 'openid movements:read movements:write account' })))
        .resolves.toEqual({ sub: SUB, email: 'pilot@example.com', scopes: ['movements:read', 'movements:write'] });
    });

    it('caches the keys and refetches for an unknown kid, rate limited', async () => {
      await verifier.verify(sign(keys.privateKey));
      await verifier.verify(sign(keys.privateKey));
      expect(fetchImpl).toHaveBeenCalledTimes(1);

      // Rotation: the new key appears in the JWKS later.
      const rotated = keyPair();
      expect(await rejection(sign(rotated.privateKey, {}, { kid: 'k2' }))).toBe('unknown key');
      expect(fetchImpl).toHaveBeenCalledTimes(1);
      jwks = { keys: [...jwks.keys, publicJwk(rotated.publicKey, 'k2')] };
      clock += 31 * 1000;
      await expect(verifier.verify(sign(rotated.privateKey, {}, { kid: 'k2' }))).resolves.toEqual(expect.objectContaining({ sub: SUB }));
      expect(fetchImpl).toHaveBeenCalledTimes(2);
    });

    it('ignores keys that are not EC P-256 signing keys', async () => {
      const rsa = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
      jwks = { keys: [{ ...rsa.publicKey.export({ format: 'jwk' }), kid: 'k1', alg: 'RS256' }] };
      expect(await rejection(sign(keys.privateKey))).toBe('unknown key');
    });

    it('fails as an infrastructure error when the keys cannot be fetched', async () => {
      fetchImpl.mockImplementation(async () => {
        throw new TypeError('fetch failed');
      });
      const error = await verifier.verify(sign(keys.privateKey)).then(() => null, e => e);
      expect(error).not.toBeInstanceOf(LoginTokenRejected);
      expect(error.message).toMatch(/Fetching the login keys failed/);

      fetchImpl.mockImplementation(async () => ({ ok: false, status: 503, json: async () => ({}) }));
      clock += 31 * 1000;
      const unavailable = await verifier.verify(sign(keys.privateKey)).then(() => null, e => e);
      expect(unavailable.message).toMatch(/answered 503/);
    });

    it('keeps using cached keys when a refetch fails', async () => {
      await verifier.verify(sign(keys.privateKey));
      fetchImpl.mockImplementation(async () => {
        throw new TypeError('fetch failed');
      });
      clock += 11 * 60 * 1000;
      await expect(verifier.verify(sign(keys.privateKey))).resolves.toEqual(expect.objectContaining({ sub: SUB }));
      expect(logger.warn).toHaveBeenCalled();
    });
  });

  describe('api/http/centralLoginConfig', () => {
    it('accepts a complete config', () => {
      expect(validateCentralLogin(CONFIG)).toBe(CONFIG);
      expect(validateCentralLogin({ ...CONFIG, issuer: 'http://localhost:4000', jwksUri: 'http://localhost:4000/jwks' })).toBeTruthy();
    });

    it.each([
      [null, 'must be an object'],
      [[], 'must be an object'],
      [{ issuer: CONFIG.issuer, audience: CONFIG.audience }, 'exactly'],
      [{ ...CONFIG, extra: 1 }, 'exactly'],
      [{ ...CONFIG, issuer: 'http://login.example.ch' }, 'issuer'],
      [{ ...CONFIG, issuer: 'https://login.example.ch/' }, 'issuer'],
      [{ ...CONFIG, issuer: 'https://login.example.ch/path' }, 'issuer'],
      [{ ...CONFIG, jwksUri: 'ftp://login.example.ch/jwks' }, 'jwksUri'],
      [{ ...CONFIG, jwksUri: 'https://login.example.ch/jwks?x=1' }, 'jwksUri'],
      [{ ...CONFIG, audience: 'Flightbox LSZE' }, 'audience'],
      [{ ...CONFIG, audience: 42 }, 'audience'],
    ])('rejects %j', (config, message) => {
      expect(() => validateCentralLogin(config)).toThrow(message);
    });
  });
});
