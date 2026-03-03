export function filter<T>(
  obj: Record<string, T>,
  predicate: (key: string, value: T) => boolean
): Record<string, T> {
  const result: Record<string, T> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key) && predicate(key, obj[key]) === true) {
      result[key] = obj[key];
    }
  }
  return result;
}
