'use strict';

const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });
const { verifyAuthenticationResponse } = require('@simplewebauthn/server');
const {
  getRpConfig,
  consumeChallenge,
} = require('./webauthnHelpers');

async function resolveUidForCredential(credentialId, challengeUid) {
  if (challengeUid) {
    return challengeUid;
  }
  const snapshot = await admin.database().ref('/webauthnCredentialOwners').child(credentialId).once('value');
  if (!snapshot.exists()) {
    return null;
  }
  const value = snapshot.val() || {};
  return typeof value.uid === 'string' ? value.uid : null;
}

async function loadCredential(uid, credentialId) {
  const snapshot = await admin.database().ref('/webauthnCredentials').child(uid).child(credentialId).once('value');
  if (!snapshot.exists()) {
    return null;
  }
  return snapshot.val();
}

async function resolveUserEmail(uid) {
  try {
    const record = await admin.auth().getUser(uid);
    return record.email || null;
  } catch (e) {
    return null;
  }
}

exports.verifyWebauthnAuthentication = functions.region('europe-west1').https.onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      const { challengeKey, assertionResponse } = req.body || {};
      if (!challengeKey || !assertionResponse || !assertionResponse.id) {
        return res.status(400).json({ error: 'challengeKey and assertionResponse are required' });
      }

      let challengeRecord;
      try {
        challengeRecord = await consumeChallenge(challengeKey, 'authentication');
      } catch (e) {
        return res.status(400).json({ error: 'Invalid or expired challenge' });
      }

      const credentialId = assertionResponse.id;

      const uid = await resolveUidForCredential(credentialId, challengeRecord.uid);
      if (!uid) {
        return res.status(400).json({ error: 'Unknown credential' });
      }

      const stored = await loadCredential(uid, credentialId);
      if (!stored) {
        return res.status(400).json({ error: 'Unknown credential' });
      }

      const { rpID, expectedOrigins } = getRpConfig();

      let verification;
      try {
        verification = await verifyAuthenticationResponse({
          response: assertionResponse,
          expectedChallenge: challengeRecord.challenge,
          expectedOrigin: expectedOrigins,
          expectedRPID: rpID,
          requireUserVerification: false,
          authenticator: {
            credentialID: credentialId,
            credentialPublicKey: Buffer.from(stored.publicKey, 'base64url'),
            counter: stored.counter || 0,
            transports: Array.isArray(stored.transports) ? stored.transports : undefined,
          },
        });
      } catch (e) {
        console.warn('Authentication verification failed:', e.message);
        return res.status(400).json({ error: 'Authentication verification failed' });
      }

      if (!verification.verified || !verification.authenticationInfo) {
        return res.status(400).json({ error: 'Authentication not verified' });
      }

      const newCounter = verification.authenticationInfo.newCounter;
      const storedCounter = stored.counter || 0;
      if (newCounter !== 0 || storedCounter !== 0) {
        if (typeof newCounter !== 'number' || newCounter <= storedCounter) {
          console.warn('Passkey counter did not increase — possible clone', { uid, credentialId, storedCounter, newCounter });
          return res.status(400).json({ error: 'Authentication verification failed' });
        }
      }

      await admin.database().ref('/webauthnCredentials').child(uid).child(credentialId).update({
        counter: newCounter,
        lastUsedAt: Date.now(),
      });

      const email = challengeRecord.email || await resolveUserEmail(uid);

      const customToken = await admin.auth().createCustomToken(uid, email ? { email } : {});
      res.status(200).json({ token: customToken });
    } catch (error) {
      console.error('Error verifying passkey authentication:', error);
      res.status(500).json({ error: 'Failed to verify authentication' });
    }
  });
});
