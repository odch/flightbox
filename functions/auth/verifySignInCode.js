'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const crypto = require('crypto');
const cors = require('cors')({origin: true});

const MAX_ATTEMPTS = 5;

const hashCode = (code) => {
  return crypto.createHash('sha256').update(code).digest('hex');
};

const validateRequest = (method, body) => {
  if (method !== 'POST') {
    return { error: 'Method not allowed', status: 405 };
  }

  const { email, code } = body;

  if (!email || !code) {
    return { error: 'Email and code are required', status: 400 };
  }

  return null;
};

exports.verifySignInCode = functions.region('europe-west1').https.onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      const validationError = validateRequest(req.method, req.body);
      if (validationError) {
        return res.status(validationError.status).json({ error: validationError.error });
      }

      const { email, code } = req.body;
      const normalizedEmail = email.toLowerCase();
      const codeHash = hashCode(code);
      const now = Date.now();

      const db = admin.database();
      const codesRef = db.ref('/signInCodes');

      const snapshot = await codesRef
        .orderByChild('email')
        .equalTo(normalizedEmail)
        .once('value');

      if (!snapshot.exists()) {
        return res.status(400).json({ error: 'Invalid or expired code' });
      }

      let validKey = null;
      const attemptsUpdates = {};

      snapshot.forEach(child => {
        const data = child.val();
        if (data.expiry <= now || data.attempts >= MAX_ATTEMPTS) {
          return;
        }
        if (validKey === null && data.codeHash === codeHash) {
          validKey = child.key;
        } else {
          attemptsUpdates[`${child.key}/attempts`] = (data.attempts || 0) + 1;
        }
      });

      if (Object.keys(attemptsUpdates).length > 0) {
        await codesRef.update(attemptsUpdates);
      }

      if (!validKey) {
        return res.status(400).json({ error: 'Invalid or expired code' });
      }

      // Consume the code (delete it so it can only be used once)
      await codesRef.child(validKey).remove();

      // Get or create the Firebase Auth user
      let uid;
      try {
        const userRecord = await admin.auth().getUserByEmail(normalizedEmail);
        uid = userRecord.uid;
      } catch (e) {
        if (e.code === 'auth/user-not-found') {
          const newUser = await admin.auth().createUser({ email: normalizedEmail });
          uid = newUser.uid;
        } else {
          throw e;
        }
      }

      const customToken = await admin.auth().createCustomToken(uid, { email: normalizedEmail });
      res.status(200).json({ token: customToken });
    } catch (error) {
      console.error('Error verifying sign-in code:', error);
      res.status(500).json({
        error: 'Failed to verify sign-in code',
      });
    }
  });
});
