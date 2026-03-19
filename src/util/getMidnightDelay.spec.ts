import { getMidnightDelayMs } from './getMidnightDelay';

describe('getMidnightDelayMs', () => {
  it('should return a positive number', () => {
    expect(getMidnightDelayMs()).toBeGreaterThan(0);
  });

  it('should return a value <= 86400000 (24 hours in ms)', () => {
    expect(getMidnightDelayMs()).toBeLessThanOrEqual(86_400_000);
  });
});
