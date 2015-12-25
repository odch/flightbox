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

  isoStartOfDay(jsDate) {
    return moment(jsDate).tz('Europe/Zurich').startOf('day').toISOString();
  },

  isoEndOfDay(jsDate) {
    return moment(jsDate).tz('Europe/Zurich').endOf('day').toISOString();
  },
};

export default dates;
