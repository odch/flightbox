import dates from './dates';

describe('util', () => {
  describe('dates', () => {
    describe('localToIsoUtc', () => {
      it('converts local summer date to UTC', () => {
        expect(dates.localToIsoUtc('2015-07-24', '07:10')).toBe('2015-07-24T05:10:00.000Z');
      });

      it('converts local winter date to UTC', () => {
        expect(dates.localToIsoUtc('2015-12-24', '07:10')).toBe('2015-12-24T06:10:00.000Z');
      });

      it('throws an error if no date given', () => {
        expect(() => dates.localToIsoUtc(null, '07:10')).toThrow('Date "null" does not match pattern YYYY-MM-DD');
      });

      it('throws an error if invalid date given', () => {
        expect(() => dates.localToIsoUtc('invalid', '07:10')).toThrow('Date "invalid" does not match pattern YYYY-MM-DD');
      });

      it('throws an error if no time given', () => {
        expect(() => dates.localToIsoUtc('2015-12-24', null)).toThrow('Time "null" does not match pattern HH:mm');
      });

      it('throws an error if invalid time given', () => {
        expect(() => dates.localToIsoUtc('2015-12-24', 'invalid')).toThrow('Time "invalid" does not match pattern HH:mm');
      });
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
      const startOfDay = dates.isoStartOfDay('2015-12-25');
      expect(startOfDay).toBe('2015-12-24T23:00:00.000Z');
    });

    it('returns end of day', () => {
      const endOfDay = dates.isoEndOfDay('2015-12-25');
      expect(endOfDay).toBe('2015-12-25T22:59:59.999Z');
    });

    it('returns local date', () => {
      const localDate = dates.localDate('2015-12-25');
      expect(localDate).toBe('2015-12-25');
    });

    it('returns local time rounded up', () => {
      const date = '2015-12-25 12:12';
      expect(dates.localTimeRounded(5, 'up', date)).toBe('12:15');
      expect(dates.localTimeRounded(10, 'up', date)).toBe('12:20');
      expect(dates.localTimeRounded(15, 'up', date)).toBe('12:15');
      expect(dates.localTimeRounded(30, 'up', date)).toBe('12:30');
      expect(dates.localTimeRounded(60, 'up', date)).toBe('13:00');
    });

    it('returns local time rounded down', () => {
      const date = '2015-12-25 12:37';
      expect(dates.localTimeRounded(5, 'down', date)).toBe('12:35');
      expect(dates.localTimeRounded(10, 'down', date)).toBe('12:30');
      expect(dates.localTimeRounded(15, 'down', date)).toBe('12:30');
      expect(dates.localTimeRounded(30, 'down', date)).toBe('12:30');
      expect(dates.localTimeRounded(60, 'down', date)).toBe('12:00');
    });

    it('formats local date with default locale (de)', () => {
      expect(dates.formatDate('2015-12-29')).toBe('29.12.2015');
    });

    it('formats local date with given locale (en)', () => {
      expect(dates.formatDate('2015-12-29', 'en')).toBe('12/29/2015');
    });

    it('formats local date month with default locale (de)', () => {
      expect(dates.formatMonth('2015-12-29')).toBe('Dezember 2015');
    });

    it('formats local date month with given locale (en)', () => {
      expect(dates.formatMonth('2015-12-29', 'en')).toBe('December 2015');
    });

    it('formats local time with default locale (de)', () => {
      expect(dates.formatTime('2015-12-29', '13:13')).toBe('13:13');
    });

    it('formats local time with given locale (en)', () => {
      expect(dates.formatTime('2015-12-29', '13:13', 'en')).toBe('1:13 PM');
    });

    describe('formatDateTime', () => {
      it('formats the given timestamp as date time', () => {
        const timestamp = new Date('2020-03-22T13:48:00.000Z')
        expect(dates.formatDateTime(timestamp)).toBe('22.03.2020 14:48')
      })

      it('formats the given timestamp as date time with given locale (en)', () => {
        const timestamp = new Date('2020-03-22T13:48:00.000Z')
        expect(dates.formatDateTime(timestamp, 'en')).toBe('03/22/2020 2:48 PM')
      })
    })
  });
});
