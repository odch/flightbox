import {normalizeEmail} from './emails';
import {REGISTRATION_REGEX} from './aircrafts';

// A person whose customs declarations the customs app forwards without review
// by the aerodrome, but only for the listed aircraft (normalised
// registrations, e.g. "HBKLA"). Without aircraft, the self-declaration does
// not apply. Stored as a list of these in
// /settings/customsSelfDeclarationEmails and pushed as such to the customs
// app.
export interface SelfDeclarant {
  email: string;
  registrations: string[];
}

// Also enforced by the database rules and the customs app.
const VALID_REGISTRATION = /^[A-Z0-9]{1,10}$/;

// The same rule as for aircraft (and in the customs app): upper case, only
// letters and digits, so "hb-kla", "HB KLA" and "HBKLA" are the same.
export function normalizeRegistration(value: string): string {
  return value.toUpperCase().replace(REGISTRATION_REGEX, '');
}

export function isValidRegistration(value: string): boolean {
  return VALID_REGISTRATION.test(value);
}

// Firebase returns an array as an object when its keys are sparse.
function toArray(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }
  if (value && typeof value === 'object') {
    return Object.values(value);
  }
  return [];
}

function normalizeRegistrations(value: unknown): string[] {
  const registrations = toArray(value)
    .filter((registration): registration is string => typeof registration === 'string')
    .map(normalizeRegistration)
    .filter(isValidRegistration);
  return Array.from(new Set(registrations));
}

function toSelfDeclarant(entry: unknown): SelfDeclarant | null {
  // The first version stored plain e-mail strings (no aircraft).
  if (typeof entry === 'string') {
    return {email: normalizeEmail(entry), registrations: []};
  }
  if (entry && typeof entry === 'object' && typeof (entry as any).email === 'string') {
    return {
      email: normalizeEmail((entry as any).email),
      registrations: normalizeRegistrations((entry as any).registrations),
    };
  }
  return null;
}

// Turns the stored value into normalised self-declarants: one per e-mail
// (duplicates are merged, keeping the aircraft of both), with normalised,
// unique and valid registrations.
export function normalizeSelfDeclarants(value: unknown): SelfDeclarant[] {
  const registrationsByEmail = new Map<string, string[]>();

  toArray(value).forEach(entry => {
    const selfDeclarant = toSelfDeclarant(entry);
    if (selfDeclarant === null || selfDeclarant.email.length === 0) {
      return;
    }
    const existing = registrationsByEmail.get(selfDeclarant.email) || [];
    registrationsByEmail.set(
      selfDeclarant.email,
      Array.from(new Set([...existing, ...selfDeclarant.registrations]))
    );
  });

  return Array.from(registrationsByEmail, ([email, registrations]) => ({email, registrations}));
}
