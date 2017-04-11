import moment from 'moment-timezone';

const checkPattern = (value, pattern, errorMsg) => {
  if (!pattern.test(value)) {
    throw new Error(errorMsg);
  }
};

const dates = {
  localToIsoUtc(localDate, localTime) {
    checkPattern(localDate, /^\d{4}-\d{2}-\d{2}$/, `Date "${localDate}" does not match pattern YYYY-MM-DD`);
    checkPattern(localTime, /^\d{2}:\d{2}$/, `Time "${localTime}" does not match pattern HH:mm`);

    const dateTime = localDate + ' ' + localTime;
    return moment.tz(dateTime, 'Europe/Zurich').toISOString();
  },

  isoUtcToLocal(isoUtc) {
    const date = moment(isoUtc).tz('Europe/Zurich');
    return {
      date: date.format('YYYY-MM-DD'),
      time: date.format('HH:mm'),
    };
  },

  isoUtcToMilliseconds(isoUtc) {
    return new Date(isoUtc).getTime();
  },

  /**
   * @param localDateString optional local date string (for timezone 'Europe/Zurich'; if missing: now)
   */
  isoStartOfDay(localDateString) {
    return moment.tz(localDateString, 'Europe/Zurich').startOf('day').toISOString();
  },

  /**
   * @param localDateString optional local date string (for timezone 'Europe/Zurich'; if missing: now)
   */
  isoEndOfDay(localDateString) {
    return moment.tz(localDateString, 'Europe/Zurich').endOf('day').toISOString();
  },

  /**
   * Get the local date in format 'YYYY-MM-DD'.
   *
   * @param localDateString optional local date string (for timezone 'Europe/Zurich'; if missing: now)
   */
  localDate(localDateString) {
    return moment.tz(localDateString, 'Europe/Zurich').format('YYYY-MM-DD');
  },

  /**
   * Get the local time in format 'HH:mm'.
   *
   * @param minutesPrecision i.e. 5, 10, 15, 30, 60
   * @param direction 'up' or 'down'
   * @param localTimeString optional local time string (for timezone 'Europe/Zurich'; if missing: now)
   */
  localTimeRounded(minutesPrecision, direction, localTimeString) {
    const m = moment.tz(localTimeString, 'Europe/Zurich').seconds(0).milliseconds(0);

    const remainder = m.minutes() % minutesPrecision;

    if (remainder !== 0) {
      let add = 0;
      if (direction === 'up') {
        add = minutesPrecision - remainder;
      } else if (direction === 'down') {
        add = remainder * -1;
      }
      m.minutes(m.minutes() + add);
    }

    return m.format('HH:mm');
  },

  /**
   * Get the local date in format for given locale or locale 'de'.
   *
   * @param localDate the local date to format
   * @param locale optional locale to format the date (if missing: de)
   */
  formatDate(localDate, locale) {
    locale = locale || 'de';
    return moment.tz(localDate, 'Europe/Zurich').locale(locale).format('L');
  },

  /**
   * Get the month in format for given locale or locale 'de'.
   *
   * @param localDate the local date to format.
   * @param locale optional locale to format the date (if missing: de)
     */
  formatMonth(localDate, locale = 'de') {
    return moment.tz(localDate, 'Europe/Zurich').locale(locale).format('MMMM YYYY');
  },

  /**
   * Get the local time in format for given locale or locale 'de'.
   *
   * @param localDate date part of the local date to format
   * @param localTime time part of the local date to format
   * @param locale optional locale to format the date (if missing: de)
   */
  formatTime(localDate, localTime, locale) {
    locale = locale || 'de';
    return moment.tz(localDate + ' ' + localTime, 'Europe/Zurich').locale(locale).format('LT');
  },
};

export default dates;
