'use strict';

const crypto = require('crypto');
const admin = require('firebase-admin');
const { logger } = require('firebase-functions/v2');
const requestHelper = require('../../util/requestHelper');

// Per-IP throttle for the static login. Static credentials are a shared secret
// whose strength is the operator's choice, so cap online guessing: after
// MAX_FAILURES failed attempts from one IP within WINDOW_MS, further attempts
// from that IP are rejected until the window elapses; a successful login clears
// the counter. Best-effort — the client IP comes from X-Forwarded-For, so this
// deters opportunistic guessing rather than a determined attacker; the durable
// defenses are a strong credential and moving off static auth.
const MAX_FAILURES = 10;
const WINDOW_MS = 15 * 60 * 1000;

const parseStaticCredentials = () => {
  const raw = process.env.AUTH_STATIC_CREDENTIALS;
  if (raw) {
    return raw.split(',').map(login => {
      const parts = login.split(':');
      return {
        username: parts[0],
        password: parts[1]
      };
    })
  }
  return null;
};

const staticCredentials = parseStaticCredentials();

// RTDB keys cannot contain '.'/':' (IPv4/IPv6), so key the limiter by a hash.
const ipKey = (ip) => crypto.createHash('sha256').update(ip).digest('hex');

const authenticate = async (req, username, password) => {
  const ip = requestHelper.getIp(req);
  const limiterRef = ip
    ? admin.database().ref('/staticAuthRateLimits/' + ipKey(ip))
    : null;
  const now = Date.now();

  // Reject while the IP is in a blocked window, before (and instead of) the
  // credential check so the block holds even for a correct guess. Return the
  // same null as a wrong password — no "rate limited" oracle.
  if (limiterRef) {
    const current = (await limiterRef.once('value')).val();
    if (current && now - current.windowStart < WINDOW_MS && current.count >= MAX_FAILURES) {
      logger.warn(`Static login throttled: ${current.count} failed attempts within the window`);
      return null;
    }
  }

  const match = staticCredentials.find(
    login => login.username === username && login.password === password
  );

  if (match) {
    if (limiterRef) {
      await limiterRef.remove(); // success clears the failure counter
    }
    return username;
  }

  // Failed attempt: increment the windowed failure counter for this IP.
  if (limiterRef) {
    await limiterRef.transaction(current => {
      if (!current || now - current.windowStart >= WINDOW_MS) {
        return { windowStart: now, count: 1 };
      }
      return { windowStart: current.windowStart, count: current.count + 1 };
    });
  }
  return null;
};

module.exports = req => {
  // Validate synchronously so a missing property throws a ClientError the
  // dispatcher's try/catch can turn into a 400 (an async throw would reject
  // instead).
  const username = requestHelper.requireBodyProperty(req, 'username');
  const password = requestHelper.requireBodyProperty(req, 'password');

  if (!staticCredentials) {
    return Promise.resolve(null);
  }

  return authenticate(req, username, password);
};
