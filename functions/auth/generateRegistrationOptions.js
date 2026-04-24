'use strict';

const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });
const { generateRegistrationOptions } = require('@simplewebauthn/server');
const {
  AuthError,
  getRpConfig,
  persistChallenge,
  verifyAuthenticatedUser,
} = require('./webauthnHelpers');

async function loadExistingCredentials(uid) {
  const snapshot = await admin.database().ref('/webauthnCredentials').child(uid).once('value');
  if (!snapshot.exists()) {
    return [];
  }
  const value = snapshot.val() || {};
  return Object.keys(value).map(credentialID => ({
    id: credentialID,
    transports: Array.isArray(value[credentialID].transports) ? value[credentialID].transports : undefined,
  }));
}

exports.generateWebauthnRegistrationOptions = functions.region('europe-west1').https.onRequest((req, res) => {
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

      const { uid, email } = authContext;
      const { rpID, rpName } = getRpConfig();

      const existing = await loadExistingCredentials(uid);

      const options = await generateRegistrationOptions({
        rpName,
        rpID,
        userID: Buffer.from(uid, 'utf8'),
        userName: email || uid,
        userDisplayName: email || uid,
        attestationType: 'none',
        excludeCredentials: existing,
        authenticatorSelection: {
          residentKey: 'preferred',
          userVerification: 'preferred',
        },
      });

      const challengeKey = await persistChallenge({
        type: 'registration',
        challenge: options.challenge,
        uid,
        email,
      });

      res.status(200).json({ options, challengeKey });
    } catch (error) {
      console.error('Error generating passkey registration options:', error);
      res.status(500).json({ error: 'Failed to generate registration options' });
    }
  });
});
