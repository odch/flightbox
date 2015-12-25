import moment from 'moment-timezone';
import dates from '../core/dates.js';

/**
 * Helper class for list of movements ordered by date and time descending.
 *
 * The order is maintained when inserting into the array using the insert method
 * of this class.
 *
 * The order is not maintained if movements are inserted directly into the array
 * or if the date/time properties of the movements are changed.
 */
class MovementsArray {

  constructor(array) {
    this.array = [];
    this.keys = {}; // map for quick lookup (keys must be kept in sync with movements in the array)

    let index = 0;
    while (index < array.length) {
      this.insert(array[index++]);
    }
  }

  /**
   * Insert a movement into the array. The order of the array is maintained (by date and time).
   *
   * @param movement The movement to insert.
   * @returns {boolean} True, if the movement has been inserted (not present before), else false.
   */
  insert(movement) {
    if (!movement.key) throw new Error('Property "key" is missing');
    if (!movement.date) throw new Error('Property "date" is missing');
    if (!movement.time) throw new Error('Property "time" is missing');

    if (this.keys[movement.key] === undefined) {
      let index = this.array.length;

      this.array.push(movement);
      this.keys[movement.key] = dates.localToIsoUtc(movement.date, movement.time);

      while (index > 0) {
        const i = index;
        const j = --index;

        if (this.compare(this.array[i], this.array[j]) < 0) {
          const temp = this.array[i];
          this.array[i] = this.array[j];
          this.array[j] = temp;
        }
      }

      return true;
    }

    return false;
  }

  compare(a, b) {
    const momentA = moment(dates.localToIsoUtc(a.date, a.time));
    const momentB = moment(dates.localToIsoUtc(b.date, b.time));

    if (momentA.isBefore(momentB)) {
      return 1;
    }
    if (momentA.isAfter(momentB)) {
      return -1;
    }
    return 0;
  }
}

export default MovementsArray;
