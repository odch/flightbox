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
   * @param jsDate optional JS date (default: now)
   */
  isoStartOfDay(jsDate) {
    return moment(jsDate).tz('Europe/Zurich').startOf('day').toISOString();
  },

  /**
   * @param jsDate optional JS date (default: now)
   */
  isoEndOfDay(jsDate) {
    return moment(jsDate).tz('Europe/Zurich').endOf('day').toISOString();
  },

  /**
   * @param jsDate optional JS date (default: now)
   */
  localDate(jsDate) {
    return moment(jsDate).tz('Europe/Zurich').format('YYYY-MM-DD');
  },

  /**
   * @param minutesPrecision i.e. 5, 10, 15, 30, 60
   * @param direction 'up' or 'down'
   * @param jsDate optional JS date (default: now)
   */
  localTimeRounded(minutesPrecision, direction, jsDate) {
    const m = moment(jsDate).tz('Europe/Zurich').seconds(0).milliseconds(0);

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
