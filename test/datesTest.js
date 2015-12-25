import expect from 'expect';
import dates from '../core/dates.js';

describe('dates', () => {
  it('converts local summer date to UTC', () => {
    expect(dates.localToIsoUtc('2015-07-24', '07:10')).toBe('2015-07-24T05:10:00.000Z');
  });

  it('converts local winter date to UTC', () => {
    expect(dates.localToIsoUtc('2015-12-24', '07:10')).toBe('2015-12-24T06:10:00.000Z');
  });

  it('converts UTC to local summer date', () => {
    const local = dates.isoUtcToLocal('2015-07-24T06:10:00.000Z');
    expect(local.date).toBe('2015-07-24');
    expect(local.time).toBe('08:10');
  });

  it('converts UTC to local winter date', () => {
    const local = dates.isoUtcToLocal('2015-12-24T06:10:00.000Z');
    expect(local.date).toBe('2015-12-24');
    expect(local.time).toBe('07:10');
  });

  it('converts UTC to milliseconds', () => {
    const milliseconds = dates.isoUtcToMilliseconds('2015-12-24T06:10:00.000Z');
    expect(milliseconds).toBe(1450937400000);
  });
});
