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
class ImmutableItemsArray {

  /**
   * @param array A sorted array
   */
  constructor(array) {
    this.array = [];
    this.keys = {}; // map for quick lookup (keys must be kept in sync with items in the array)

    if (array) {
      array.forEach((item, index) => {
        this.array.push(item);
        this.keys[item.key] = index;
      });
    }
  }

  getByKey(key) {
    const index = this.keys[key];
    if (typeof index === 'number') {
      return this.array[index];
    }
    return null;
  }

  /**
   * Insert an item into the array. The order of the array is maintained (according to the given comparator).
   *
   * @param item The item to insert.
   * @param comparator
   * @returns {ImmutableItemsArray} The new array
   */
  insert(item, comparator) {
    if (!item.key) throw new Error('Property "key" is missing');

    if (this.keys[item.key] === undefined) {
      const newArr = this.array.slice();
      let index = bs(newArr, item, comparator);
      if (index < 0) {
        index = (index + 1) * -1;
      }
      newArr.splice(index, 0, item);

      return new ImmutableItemsArray(newArr);
    }

    return this;
  }

  update(item, comparator) {
    if (!item.key) throw new Error('Property "key" is missing');

    const currentIndex = this.keys[item.key];

    if (typeof currentIndex === 'number') {
      const newArr = this.array.slice(0);
      newArr.splice(currentIndex, 1);

      let index = bs(newArr, item, comparator);
      if (index < 0) {
        index = (index + 1) * -1;
      }
      newArr.splice(index, 0, item);

      return new ImmutableItemsArray(newArr);
    }

    return this;
  }

  remove(key) {
    const currentIndex = this.keys[key];

    if (typeof currentIndex === 'number') {
      const newArr = this.array.slice(0);
      newArr.splice(currentIndex, 1);

      return new ImmutableItemsArray(newArr);
    }

    return this;
  }

  insertAll(items, comparator) {
    const newArr = this.array.slice();

    items.forEach(item => {
      if (!item.key) throw new Error('Property "key" is missing');

      if (this.keys[item.key] === undefined) {
        if (typeof comparator === 'function') {
          let index = bs(newArr, item, comparator);
          if (index < 0) {
            index = (index + 1) * -1;
          }
          newArr.splice(index, 0, item);
        } else {
          newArr.push(item);
        }
      }
    });

    return new ImmutableItemsArray(newArr);
  }
}

export default ImmutableItemsArray;
