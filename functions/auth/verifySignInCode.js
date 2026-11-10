'use strict';

const { onRequest } = require('firebase-functions/v2/https');
const { getAuth } = require('firebase-admin/auth');
const { getDatabase } = require('firebase-admin/database');
const crypto = require('crypto');
const cors = require('cors')({origin: true});
const { normalizeEmail } = require('./signInEmail');

const MAX_ATTEMPTS = 5;
const CODE_PATTERN = /^\d{6}$/;

const hashCode = (code) => {
  return crypto.createHash('sha256').update(code).digest('hex');
};

/**
 * Returns the Firebase Auth user for an email whose ownership was just proven
 * with a sign-in code, creating it if needed.
 */
const getOrCreateVerifiedUser = async (auth, email) => {
  let user;
  try {
    user = await auth.getUserByEmail(email);
  } catch (e) {
    if (e.code !== 'auth/user-not-found') {
      throw e;
    }
    try {
      return await auth.createUser({ email, emailVerified: true });
    } catch (createError) {
      // Lost a race against a concurrent sign-in creating the same user.
      if (createError.code !== 'auth/email-already-exists') {
        throw createError;
      }
      user = await auth.getUserByEmail(email);
    }
  }

  if (!user.emailVerified) {
    // Nobody had proven ownership of this address before, so the account
    // may have been registered with a password through the public API key
    // (and the password possibly unlinked again). The code proves ownership
    // now: replace the password and end existing sessions so whoever
    // pre-registered the address cannot keep using it. Accounts created by
    // earlier code sign-ins are unverified too; their owner is signed out on
    // other devices once.
    user = await auth.updateUser(user.uid, {
      emailVerified: true,
      password: crypto.randomBytes(32).toString('base64url'),
    });
    await auth.revokeRefreshTokens(user.uid);
  }

  return user;
};

const validateRequest = (method, body) => {
  if (method !== 'POST') {
    return { error: 'Method not allowed', status: 405 };
  }

  const { email, code } = body;

  if (!email || !code) {
    return { error: 'Email and code are required', status: 400 };
  }

  // A malformed code can never match, so reject it without counting it as an
  // attempt.
  if (!normalizeEmail(email) || typeof code !== 'string' || !CODE_PATTERN.test(code)) {
    return { error: 'Invalid or expired code', status: 400 };
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
      const normalizedEmail = normalizeEmail(email);
      const codeHash = hashCode(code);
      const now = Date.now();

      const db = getDatabase();
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
          // The update function runs again on every retry, so the match must
          // reflect the final run only. Otherwise a match seen against a stale
          // value would survive a retry against the server's state, letting a
          // code that was consumed, capped or replaced meanwhile be redeemed.
          didMatch = false;
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

      const user = await getOrCreateVerifiedUser(getAuth(), normalizedEmail);
      const customToken = await getAuth().createCustomToken(user.uid, { email: normalizedEmail });
      res.status(200).json({ token: customToken });
    } catch (error) {
      console.error('Error verifying sign-in code:', error);
      res.status(500).json({
        error: 'Failed to verify sign-in code',
      });
    }
  });
});
