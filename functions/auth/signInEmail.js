'use strict';

const MAX_EMAIL_LENGTH = 254;

// Deliberately strict: no quoted local parts, whitespace, commas or angle
// brackets. The address is handed to nodemailer, which would parse e.g.
// 'a1,victim@example.com' as several recipients, each variation of the filler
// getting its own rate limit. The pattern also cannot backtrack, so a huge
// input cannot tie up the function.
const EMAIL_PATTERN = /^[a-z0-9!#$%&'*+/=?^_`{|}~.-]+@([a-z0-9-]+\.)+[a-z]{2,}$/;

/**
 * Returns the trimmed, lower-cased email, or null if it is not a valid
 * address. Firebase Auth stores emails lower-cased, so this keeps the code,
 * the rate limit and the user record keyed the same way.
 */
const normalizeEmail = (email) => {
  if (typeof email !== 'string') {
    return null;
  }
  const normalized = email.trim().toLowerCase();
  if (normalized.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(normalized)) {
    return null;
  }
  return normalized;
};

const GMAIL_DOMAINS = ['gmail.com', 'googlemail.com'];

/**
 * The mailbox a normalized address delivers to, for rate limiting only:
 * 'pilot+1@x.ch' and 'p.ilot@gmail.com' would otherwise each get their own
 * limit while landing in the same inbox. Dropping a '+tag' on a provider
 * without subaddressing merely makes the limit stricter. Codes and the
 * Firebase user stay keyed by the exact address.
 */
const mailboxKey = (email) => {
  const at = email.lastIndexOf('@');
  let local = email.slice(0, at).split('+')[0];
  let domain = email.slice(at + 1);
  if (GMAIL_DOMAINS.includes(domain)) {
    local = local.replace(/\./g, '');
    domain = 'gmail.com';
  }
  return `${local}@${domain}`;
};

module.exports = {
  mailboxKey,
  normalizeEmail,
};
