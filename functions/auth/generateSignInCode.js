'use strict';

const { onRequest } = require('firebase-functions/v2/https');
const { getDatabase } = require('firebase-admin/database');
const crypto = require('crypto');
const cors = require('cors')({origin: true});
const { sendSignInEmail } = require('./sendSignInEmail');
const { mailboxKey, normalizeEmail } = require('./signInEmail');

const CODE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

// Per-mailbox rate limiting. The login UI already enforces a 60s resend
// countdown (OtpCodeForm RESEND_COOLDOWN_SECONDS); the server cooldown sits
// just under it so a legitimate resend never trips it, while scripted abuse
// (email bombing / OTP brute force) is blocked. The hourly cap is the
// sustained-abuse backstop, and the daily cap bounds how many guesses an
// account can take over time (MAX_PER_DAY * MAX_ATTEMPTS a day).
const COOLDOWN_MS = 55 * 1000;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_PER_WINDOW = 10;
const DAY_WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_PER_DAY = 20;

const hashCode = (code) => {
  return crypto.createHash('sha256').update(code).digest('hex');
};

// RTDB keys cannot contain '@' or '.', so the limiter is keyed by a hash of the
// mailbox the email delivers to.
const rateLimitKey = (email) => {
  return crypto.createHash('sha256').update(mailboxKey(email)).digest('hex');
};

// The windows of a limiter entry that are still running; an expired one starts
// over with the next send. Entries written before the daily cap existed have no
// day window yet.
const runningWindows = (current, now) => ({
  hour: current && now - current.windowStart < RATE_WINDOW_MS ? current : null,
  day: current && current.dayWindowStart && now - current.dayWindowStart < DAY_WINDOW_MS ? current : null,
});

// How long the caller must wait before another code can be sent, 0 if one can
// be sent now. Reports the longest applicable wait so the UI can say when to
// retry.
const retryAfterMs = (current, now) => {
  const { hour, day } = runningWindows(current, now);
  if (day && day.dayCount >= MAX_PER_DAY) {
    return day.dayWindowStart + DAY_WINDOW_MS - now;
  }
  if (hour && hour.count >= MAX_PER_WINDOW) {
    return hour.windowStart + RATE_WINDOW_MS - now;
  }
  if (current && now - current.lastSentAt < COOLDOWN_MS) {
    return current.lastSentAt + COOLDOWN_MS - now;
  }
  return 0;
};

const validateRequest = (method, body) => {
  if (method !== 'POST') {
    return { error: 'Method not allowed', status: 405 };
  }

  const { email } = body;

  if (!email) {
    return { error: 'Email is required', status: 400 };
  }

  if (!normalizeEmail(email)) {
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
      const normalizedEmail = normalizeEmail(email);
      const db = getDatabase();
      const now = Date.now();

      // Per-mailbox rate limiting: reject if a code was sent very recently
      // (cooldown) or too many were sent within the hourly or daily window. The
      // limiter is checked-and-incremented before sending so a forced email
      // failure cannot be used to bypass it. It is keyed by mailbox, so
      // 'pilot+1@x.ch' or 'p.ilot@gmail.com' don't get a limit of their own.
      const rateLimitRef = db.ref('/signInRateLimits/' + rateLimitKey(normalizedEmail));
      const rateLimit = await rateLimitRef.transaction(current => {
        if (retryAfterMs(current, now) > 0) {
          return; // cooldown not elapsed or a cap reached — abort
        }
        const { hour, day } = runningWindows(current, now);
        return {
          windowStart: hour ? hour.windowStart : now,
          count: hour ? hour.count + 1 : 1,
          dayWindowStart: day ? day.dayWindowStart : now,
          dayCount: day ? day.dayCount + 1 : 1,
          lastSentAt: now,
        };
      });

      if (!rateLimit.committed) {
        // Tell the caller when they can retry so the UI can show a clear
        // "try again in X" message instead of a generic error. The aborted
        // transaction's snapshot holds the current limiter state.
        const current = rateLimit.snapshot && rateLimit.snapshot.val();
        const waitMs = current ? retryAfterMs(current, now) : COOLDOWN_MS;
        const retryAfterSeconds = Math.max(1, Math.ceil(waitMs / 1000));
        res.set('Retry-After', String(retryAfterSeconds));
        return res.status(429).json({
          error: 'Too many requests. Please try again later.',
          retryAfterSeconds,
        });
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
