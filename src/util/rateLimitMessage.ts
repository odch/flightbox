// Picks the translation key (and interpolation values) for a sign-in code rate
// limit, based on the server-provided retry time. Short waits (the ~55s
// cooldown) get a generic "wait a moment" message; longer waits (the hourly cap)
// get a "try again in about X minutes" message.
export function rateLimitMessage(retryAfterSeconds?: number): { key: string; values?: { minutes: number } } {
  if (retryAfterSeconds && retryAfterSeconds > 60) {
    return {
      key: 'login.tooManyRequestsMinutes',
      values: { minutes: Math.ceil(retryAfterSeconds / 60) },
    };
  }
  return { key: 'login.tooManyRequests' };
}
