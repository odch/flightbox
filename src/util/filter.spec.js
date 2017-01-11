import expect from 'expect';
import { filter } from './filter';

describe('filter', () => {
  it('filters according to the given predicate', () => {
    const obj = {
      a: true, b: true, c: true,
    };
    const filtered = filter(obj, (key, value) => {
      return key === 'b';
    });
    expect(filtered.b).toBe(obj.b);
    expect(filtered.a).toBe(undefined);
    expect(filtered.c).toBe(undefined);
  });
});
