import dates from '../../util/dates';

const EXPIRY_WARNING_MS = 30 * 24 * 60 * 60 * 1000;

export type ExpiryStatus = 'unlimited' | 'valid' | 'expiresSoon' | 'expired';

// Timestamps are ms since epoch; shown in Swiss local time like other dates.
export const formatDate = (timestamp: number): string =>
  dates.formatDate(new Date(timestamp).toISOString());

export const formatDateTime = (timestamp: number): string =>
  dates.formatDateTime(new Date(timestamp).toISOString());

export const expiryStatus = (expiresAt: number | null, now: number): ExpiryStatus => {
  if (expiresAt === null) {
    return 'unlimited';
  }
  if (expiresAt <= now) {
    return 'expired';
  }
  if (expiresAt - now <= EXPIRY_WARNING_MS) {
    return 'expiresSoon';
  }
  return 'valid';
};
