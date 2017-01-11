export function filter(obj, predicate) {
  const result = {};
  for (let key in obj) {
    if (obj.hasOwnProperty(key) && predicate(key, obj[key]) === true) {
      result[key] = obj[key];
    }
  }
  return result;
}
