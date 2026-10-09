// Upper bound of an e-mail address (RFC 5321 path length); also enforced by
// the database rules.
export const MAX_EMAIL_LENGTH = 254;

// Deliberately permissive: one @, something before it, a dot in the domain
// and no whitespace. The receiving system validates in detail.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidEmail(value: string): boolean {
  return value.length <= MAX_EMAIL_LENGTH && EMAIL_PATTERN.test(value);
}

// An entry is an e-mail, or an `{email, registrations}` object written by an
// earlier version (with aircraft per person); its aircraft no longer matter.
function entryEmail(entry: unknown): unknown {
  return entry && typeof entry === 'object' ? (entry as {email?: unknown}).email : entry;
}

// Turns a stored list (an array, or an object when Firebase returns a sparse
// array) into normalised, unique e-mail strings.
export function normalizeEmailList(value: unknown): string[] {
  let entries: unknown[] = [];
  if (Array.isArray(value)) {
    entries = value;
  } else if (value && typeof value === 'object') {
    entries = Object.values(value);
  }

  const emails = entries
    .map(entryEmail)
    .filter((email): email is string => typeof email === 'string')
    .map(normalizeEmail)
    .filter(email => email.length > 0);

  return Array.from(new Set(emails));
}
