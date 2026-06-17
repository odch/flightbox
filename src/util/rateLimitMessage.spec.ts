import {rateLimitMessage} from './rateLimitMessage';

describe('rateLimitMessage', () => {
  it('returns the generic message when no retry time is given', () => {
    expect(rateLimitMessage(undefined)).toEqual({ key: 'login.tooManyRequests' });
  });

  it('returns the generic message for short waits (<= 60s cooldown)', () => {
    expect(rateLimitMessage(55)).toEqual({ key: 'login.tooManyRequests' });
    expect(rateLimitMessage(60)).toEqual({ key: 'login.tooManyRequests' });
  });

  it('returns the minutes message (rounded up) for longer waits', () => {
    expect(rateLimitMessage(61)).toEqual({ key: 'login.tooManyRequestsMinutes', values: { minutes: 2 } });
    expect(rateLimitMessage(15 * 60)).toEqual({ key: 'login.tooManyRequestsMinutes', values: { minutes: 15 } });
    expect(rateLimitMessage(15 * 60 + 1)).toEqual({ key: 'login.tooManyRequestsMinutes', values: { minutes: 16 } });
  });
});
