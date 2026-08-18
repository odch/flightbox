'use strict';

const { onRequest } = require('firebase-functions/v2/https');
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

exports.verifySignInCode = onRequest({ region: 'europe-west1' }, (req, res) => {
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

      const candidateKeys = [];
      snapshot.forEach(child => { candidateKeys.push(child.key); });

      // Check-and-increment each candidate atomically. A non-transactional
      // read-then-write lets concurrent guesses race: N parallel wrong guesses
      // all read the same `attempts` and each write `attempts + 1`, so the
      // per-code cap collapses to a single increment and the code becomes
      // brute-forceable. A per-node transaction serializes the guesses, so the
      // MAX_ATTEMPTS cap actually holds and a correct code is consumed exactly
      // once.
      let matched = false;
      for (const key of candidateKeys) {
        let didMatch = false;
        const result = await codesRef.child(key).transaction(current => {
          // RTDB may invoke this with a stale cached value (often null) before
          // retrying against the server; returning null (not undefined) forces
          // the refetch instead of aborting.
          if (current === null || current === undefined) {
            return null;
          }
          if (current.expiry <= now || current.attempts >= MAX_ATTEMPTS) {
            return current; // expired or capped: leave unchanged
          }
          if (current.codeHash === codeHash) {
            didMatch = true;
            return null; // correct code: consume it (single use)
          }
          return { ...current, attempts: (current.attempts || 0) + 1 }; // wrong: count it
        });
        if (didMatch && result.committed) {
          matched = true;
          break;
        }
      }

      if (!matched) {
        return res.status(400).json({ error: 'Invalid or expired code' });
      }

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
