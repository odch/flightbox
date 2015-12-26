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

  it('returns start of day', () => {
    const startOfDay = dates.isoStartOfDay(new Date('2015-12-25'));
    expect(startOfDay).toBe('2015-12-24T23:00:00.000Z');
  });

  it('returns end of day', () => {
    const endOfDay = dates.isoEndOfDay(new Date('2015-12-25'));
    expect(endOfDay).toBe('2015-12-25T22:59:59.999Z');
  });

  it('returns local date', () => {
    const localDate = dates.localDate(new Date('2015-12-25'));
    expect(localDate).toBe('2015-12-25');
  });

  it('returns local time rounded up', () => {
    const date = new Date('2015-12-25 12:12');
    expect(dates.localTimeRounded(5, 'up', date)).toBe('12:15');
    expect(dates.localTimeRounded(10, 'up', date)).toBe('12:20');
    expect(dates.localTimeRounded(15, 'up', date)).toBe('12:15');
    expect(dates.localTimeRounded(30, 'up', date)).toBe('12:30');
    expect(dates.localTimeRounded(60, 'up', date)).toBe('13:00');
  });

  it('returns local time rounded down', () => {
    const date = new Date('2015-12-25 12:37');
    expect(dates.localTimeRounded(5, 'down', date)).toBe('12:35');
    expect(dates.localTimeRounded(10, 'down', date)).toBe('12:30');
    expect(dates.localTimeRounded(15, 'down', date)).toBe('12:30');
    expect(dates.localTimeRounded(30, 'down', date)).toBe('12:30');
    expect(dates.localTimeRounded(60, 'down', date)).toBe('12:00');
  });
});
