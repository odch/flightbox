import bs from 'binary-search';

/**
 * Helper class for list of items ordered by given comparator.
 *
 * The order is maintained when inserting into the array using the insert method
 * of this class.
 *
 * The order is not maintained if items are inserted directly into the array
 * or if the properties of the items are changed.
 */
class ItemsArray {

  constructor(array, comparator) {
    this.comparator = comparator;
    this.array = [];
    this.keys = {}; // map for quick lookup (keys must be kept in sync with items in the array)

    const arrCopy = array.slice();
    arrCopy.sort(this.comparator);

    let index = 0;
    while (index < arrCopy.length) {
      this.insert(arrCopy[index++]);
    }
  }

  /**
   * Insert an item into the array. The order of the array is maintained (according to the given comparator).
   *
   * @param item The item to insert.
   * @returns {boolean} True, if the item has been inserted (not present before), else false.
   */
  insert(item) {
    if (!item.key) throw new Error('Property "key" is missing');

    if (this.keys[item.key] === undefined) {
      this.keys[item.key] = true;
      let index = bs(this.array, item, this.comparator);
      if (index < 0) {
        index = (index + 1) * -1;
      }
      this.array.splice(index, 0, item);

      return true;
    }

    return false;
  }
}

export default ItemsArray;
