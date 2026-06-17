'use strict';

const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const crypto = require('crypto');
const cors = require('cors')({origin: true});
const { sendSignInEmail } = require('./sendSignInEmail');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

// Per-email rate limiting. The login UI already enforces a 60s resend countdown
// (OtpCodeForm RESEND_COOLDOWN_SECONDS); the server cooldown sits just under it
// so a legitimate resend never trips it, while scripted abuse (email bombing /
// OTP brute force) is blocked. The hourly cap is the sustained-abuse backstop.
const COOLDOWN_MS = 55 * 1000;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_PER_WINDOW = 5;

const hashCode = (code) => {
  return crypto.createHash('sha256').update(code).digest('hex');
};

// RTDB keys cannot contain '@' or '.', so the limiter is keyed by a hash of the
// normalized email.
const emailKey = (email) => {
  return crypto.createHash('sha256').update(email).digest('hex');
};

const validateRequest = (method, body) => {
  if (method !== 'POST') {
    return { error: 'Method not allowed', status: 405 };
  }

  const { email } = body;

  if (!email) {
    return { error: 'Email is required', status: 400 };
  }

  if (!EMAIL_REGEX.test(email)) {
    return { error: 'Invalid email format', status: 400 };
  }

  return null;
};

exports.generateSignInCode = onRequest({ region: 'europe-west1' }, (req, res) => {
  return cors(req, res, async () => {
    try {
      const validationError = validateRequest(req.method, req.body);
      if (validationError) {
        return res.status(validationError.status).json({ error: validationError.error });
      }

      const { email, airportName, themeColor, language } = req.body;
      const normalizedEmail = email.toLowerCase();
      const db = admin.database();
      const now = Date.now();

      // Per-email rate limiting: reject if a code was sent very recently
      // (cooldown) or too many were sent within the rolling window. The limiter
      // is checked-and-incremented before sending so a forced email failure
      // cannot be used to bypass it.
      const rateLimitRef = db.ref('/signInRateLimits/' + emailKey(normalizedEmail));
      const rateLimit = await rateLimitRef.transaction(current => {
        if (!current || now - current.windowStart >= RATE_WINDOW_MS) {
          return { windowStart: now, lastSentAt: now, count: 1 };
        }
        if (now - current.lastSentAt < COOLDOWN_MS) {
          return; // cooldown not elapsed — abort
        }
        if (current.count >= MAX_PER_WINDOW) {
          return; // hourly cap reached — abort
        }
        return { windowStart: current.windowStart, lastSentAt: now, count: current.count + 1 };
      });

      if (!rateLimit.committed) {
        return res.status(429).json({ error: 'Too many requests. Please try again later.' });
      }

      // Keep only one live code per email: remove any existing codes first so a
      // caller cannot accumulate many concurrently-valid codes.
      const codesRef = db.ref('/signInCodes');
      const existing = await codesRef.orderByChild('email').equalTo(normalizedEmail).once('value');
      if (existing.exists()) {
        const deletions = {};
        existing.forEach(child => { deletions[child.key] = null; });
        await codesRef.update(deletions);
      }

      const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
      const codeHash = hashCode(code);
      const expiry = now + CODE_EXPIRY_MS;

      await codesRef.push({
        email: normalizedEmail,
        codeHash,
        expiry,
        attempts: 0,
      });

      await sendSignInEmail({ email: normalizedEmail, signInCode: code, airportName, themeColor, language });

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error generating sign-in code:', error);
      res.status(500).json({
        error: 'Failed to send sign-in code',
      });
    }
  });
});
