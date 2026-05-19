'use strict';

const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });
const { generateAuthenticationOptions } = require('@simplewebauthn/server');
const {
  getRpConfig,
  persistChallenge,
} = require('./webauthnHelpers');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function resolveUidByEmail(email) {
  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    return userRecord.uid;
  } catch (e) {
    if (e && e.code === 'auth/user-not-found') {
      return null;
    }
    throw e;
  }
}

async function loadAllowCredentials(uid) {
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

exports.generateWebauthnAuthenticationOptions = onRequest({ region: 'europe-west1' }, (req, res) => {
  return cors(req, res, async () => {
    try {
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      const rawEmail = req.body && typeof req.body.email === 'string' ? req.body.email.trim() : '';
      const email = rawEmail ? rawEmail.toLowerCase() : null;

      if (email && !EMAIL_REGEX.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      const { rpID } = getRpConfig();

      let uid = null;
      let allowCredentials = [];

      if (email) {
        uid = await resolveUidByEmail(email);
        if (uid) {
          allowCredentials = await loadAllowCredentials(uid);
        }
        // Intentionally do not disclose whether the email exists; return plausible options.
      }

      const options = await generateAuthenticationOptions({
        rpID,
        userVerification: 'preferred',
        allowCredentials,
      });

      const challengeKey = await persistChallenge({
        type: 'authentication',
        challenge: options.challenge,
        uid,
        email,
      });

      res.status(200).json({ options, challengeKey });
    } catch (error) {
      console.error('Error generating passkey authentication options:', error);
      res.status(500).json({ error: 'Failed to generate authentication options' });
    }
  });
});
