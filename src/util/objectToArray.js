/**
 * Converts objects like
 *
 * {
 *  0: 'foo',
 *  1: 'bar'
 * }
 *
 * to an array like
 *
 * ['foo', 'bar']
 */
export default function objectToArray(obj) {
  const keys = Object.keys(obj);
  keys.sort();

  const newArr = [];
  keys.forEach(key => {
    newArr.push(obj[key]);
  });

  return newArr;
}
