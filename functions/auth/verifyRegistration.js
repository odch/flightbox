'use strict';

const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });
const { verifyRegistrationResponse } = require('@simplewebauthn/server');
const {
  AuthError,
  getRpConfig,
  consumeChallenge,
  verifyAuthenticatedUser,
} = require('./webauthnHelpers');

function deriveDeviceName(userAgent) {
  if (typeof userAgent !== 'string' || !userAgent) return 'Passkey';
  if (/iPhone/.test(userAgent)) return 'iPhone';
  if (/iPad/.test(userAgent)) return 'iPad';
  if (/Android/.test(userAgent)) return 'Android';
  if (/Macintosh|Mac OS X/.test(userAgent)) return 'Mac';
  if (/Windows/.test(userAgent)) return 'Windows';
  if (/Linux/.test(userAgent)) return 'Linux';
  return 'Passkey';
}

function toBase64Url(value) {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (value instanceof Uint8Array || Buffer.isBuffer(value)) {
    return Buffer.from(value).toString('base64url');
  }
  return null;
}

exports.verifyWebauthnRegistration = functions.region('europe-west1').https.onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      let authContext;
      try {
        authContext = await verifyAuthenticatedUser(req);
      } catch (e) {
        if (e instanceof AuthError) {
          return res.status(401).json({ error: e.message });
        }
        throw e;
      }

      const { uid } = authContext;
      const { challengeKey, attestationResponse, userAgent } = req.body || {};

      if (!challengeKey || !attestationResponse) {
        return res.status(400).json({ error: 'challengeKey and attestationResponse are required' });
      }

      let challengeRecord;
      try {
        challengeRecord = await consumeChallenge(challengeKey, 'registration');
      } catch (e) {
        return res.status(400).json({ error: 'Invalid or expired challenge' });
      }

      if (challengeRecord.uid !== uid) {
        return res.status(400).json({ error: 'Challenge does not belong to this user' });
      }

      const { rpID, expectedOrigins } = getRpConfig();

      let verification;
      try {
        verification = await verifyRegistrationResponse({
          response: attestationResponse,
          expectedChallenge: challengeRecord.challenge,
          expectedOrigin: expectedOrigins,
          expectedRPID: rpID,
          requireUserVerification: false,
        });
      } catch (e) {
        console.warn('Registration verification failed:', e.message);
        return res.status(400).json({ error: 'Registration verification failed' });
      }

      if (!verification.verified || !verification.registrationInfo) {
        return res.status(400).json({ error: 'Registration not verified' });
      }

      const info = verification.registrationInfo;
      // v10 server returns a flat registrationInfo; support a nested `credential` shape too for forward compat.
      const credential = info.credential || {};
      const credentialIDRaw = info.credentialID || credential.id;
      const credentialPublicKeyRaw = info.credentialPublicKey || credential.publicKey;
      const counter = typeof info.counter === 'number'
        ? info.counter
        : (typeof credential.counter === 'number' ? credential.counter : 0);

      const credentialID = toBase64Url(credentialIDRaw);
      const publicKey = toBase64Url(credentialPublicKeyRaw);

      if (!credentialID || !publicKey) {
        return res.status(500).json({ error: 'Malformed registration info' });
      }

      const transports = Array.isArray(credential.transports)
        ? credential.transports
        : (attestationResponse.response && Array.isArray(attestationResponse.response.transports))
          ? attestationResponse.response.transports
          : [];

      const now = Date.now();
      const record = {
        publicKey,
        counter,
        transports,
        deviceName: deriveDeviceName(userAgent),
        createdAt: now,
        lastUsedAt: null,
        aaguid: info.aaguid || null,
        backupEligible: info.credentialBackedUp === true || credential.backupEligible === true || false,
        backupState: info.credentialDeviceType === 'multiDevice' || credential.backupState === true || false,
      };

      await admin.database().ref('/webauthnCredentials').child(uid).child(credentialID).set(record);
      await admin.database().ref('/webauthnCredentialOwners').child(credentialID).set({ uid });

      res.status(200).json({
        success: true,
        credentialId: credentialID,
        deviceName: record.deviceName,
        createdAt: record.createdAt,
      });
    } catch (error) {
      console.error('Error verifying passkey registration:', error);
      res.status(500).json({ error: 'Failed to verify registration' });
    }
  });
});
