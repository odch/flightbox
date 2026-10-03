'use strict';

// The binary-search 1.3.6 loop, without the optional bounds ItemsArray never
// passes. Keep it as is: the first probed tie (or NaN) wins, which decides the
// row order of tied movements.
function binarySearch(haystack, needle, comparator) {
  let low = 0;
  let high = haystack.length - 1;

  while (low <= high) {
    const mid = low + ((high - low) >>> 1);
    const cmp = +comparator(haystack[mid], needle, mid, haystack);

    if (cmp < 0.0) {
      low = mid + 1;
    } else if (cmp > 0.0) {
      high = mid - 1;
    } else {
      return mid;
    }
  }

  return ~low;
}

// Port of ItemsArray.ts (created with an empty array). Keys are tracked in a
// plain object like the client, so inherited names such as "constructor" or
// "__proto__" count as present and those items are never inserted. The key is
// marked before comparing, so an item whose comparison threw stays out.
function createItemsArray(comparator) {
  const array = [];
  const keys = {};

  const insert = item => {
    if (!item.key) throw new Error('Property "key" is missing');

    if (keys[item.key] === undefined) {
      keys[item.key] = true;
      let index = binarySearch(array, item, comparator);
      if (index < 0) {
        index = (index + 1) * -1;
      }
      array.splice(index, 0, item);

      return true;
    }

    return false;
  };

  return { array, insert };
}

module.exports = { binarySearch, createItemsArray };
