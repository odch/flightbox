import moment from 'moment-timezone';

class Predicates {

  /**
   * @param localDateString optional local date string (for timezone 'Europe/Zurich'; if missing: now)
   */
  static sameDay(localDateString) {
    return (movement) => moment.tz(localDateString, 'Europe/Zurich').isSame(movement.date, 'day');
  }

  /**
   * @param localDateString optional local date string (for timezone 'Europe/Zurich'; if missing: now)
   */
  static olderThanSameDay(localDateString) {
    return (movement) => moment.tz(localDateString, 'Europe/Zurich').isAfter(movement.date, 'day');
  }

  /**
   * @param localDateString optional local date string (for timezone 'Europe/Zurich'; if missing: now)
   */
  static dayBefore(localDateString) {
    return (movement) => moment.tz(localDateString, 'Europe/Zurich').subtract(1, 'days').isSame(movement.date, 'day');
  }

  /**
   * @param localDateString optional local date string (for timezone 'Europe/Zurich'; if missing: now)
   */
  static sameMonth(localDateString) {
    return (movement) => moment.tz(localDateString, 'Europe/Zurich').isSame(movement.date, 'month');
  }

  /**
   * @param localDateString optional local date string (for timezone 'Europe/Zurich'; if missing: now)
   */
  static olderThanSameMonth(localDateString) {
    return (movement) => moment.tz(localDateString, 'Europe/Zurich').isAfter(movement.date, 'month');
  }

  static not(predicate) {
    return (item) => {
      return !predicate(item);
    };
  }

  static and(/* predicates */) {
    const predicates = arguments;
    return (item) => {
      for (let i = 0; i < predicates.length; i++) {
        if (!predicates[i](item)) {
          return false;
        }
      }
      return true;
    };
  }
}

export default Predicates;
