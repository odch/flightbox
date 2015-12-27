import moment from 'moment-timezone';

const dates = {
  localToIsoUtc(localDate, localTime) {
    const dateTime = localDate + ' ' + localTime;
    return moment.tz(dateTime, 'Europe/Zurich').toISOString();
  },

  isoUtcToLocal(isoUtc) {
    const date = moment(isoUtc).tz('Europe/Zurich').locale('de');
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
   * @param localDateString optional local date string (for timezone 'Europe/Zurich'; if missing: now)
   */
  localDate(localDateString) {
    return moment.tz(localDateString, 'Europe/Zurich').format('YYYY-MM-DD');
  },

  /**
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
};

export default dates;
