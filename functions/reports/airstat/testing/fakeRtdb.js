'use strict';

// In-memory stand-in for the Admin SDK database in the airstat specs.
// Supports ref(path).once('value') and
// ref(path).orderByChild(child).startAt(a).endAt(b).once('value'),
// ordering query results like the database: by the child value (missing,
// false, true, numbers, strings, objects), then by key. A query snapshot has
// no val(): the real one is a plain object in key order, so reading it would
// silently lose the query order.

const TYPE_RANK = { undefined: 0, boolean: 1, number: 3, string: 4, object: 5 };

function rank(value) {
  if (value === null || value === undefined) {
    return 0;
  }
  if (value === true) {
    return 2;
  }
  return TYPE_RANK[typeof value];
}

function compareValues(a, b) {
  const byRank = rank(a) - rank(b);
  if (byRank !== 0 || rank(a) === 0 || rank(a) === 5) {
    return byRank;
  }
  return a < b ? -1 : a > b ? 1 : 0;
}

// Keys in canonical integer form come first, numerically, then the others
// (a simplification of the SDK's rule; push keys are never integers).
const INTEGER_KEY = /^-?(0|[1-9]\d{0,9})$/;

function compareKeys(a, b) {
  const intA = INTEGER_KEY.test(a);
  const intB = INTEGER_KEY.test(b);
  if (intA && intB) {
    return Number(a) - Number(b);
  }
  if (intA !== intB) {
    return intA ? -1 : 1;
  }
  return a < b ? -1 : a > b ? 1 : 0;
}

const copy = value => (value === undefined ? null : JSON.parse(JSON.stringify(value)));

function childSnapshot(key, value) {
  return { key, val: () => copy(value) };
}

function snapshot(key, value, children, isQuery) {
  return {
    key,
    exists: () => value !== undefined && value !== null,
    forEach(callback) {
      for (const [childKey, childValue] of children) {
        if (callback(childSnapshot(childKey, childValue))) {
          return true;
        }
      }
      return false;
    },
    val() {
      if (isQuery) {
        throw new Error('fakeRtdb: read query results with forEach, val() loses their order');
      }
      return copy(value);
    },
  };
}

function createFakeRtdb(data) {
  const calls = [];

  const valueAt = path => path.split('/').filter(Boolean)
    .reduce((node, part) => (node !== null && typeof node === 'object' ? node[part] : undefined), data);

  function ref(path) {
    const query = {};
    const api = {
      orderByChild(child) {
        query.orderByChild = child;
        return api;
      },
      startAt(value) {
        query.startAt = value;
        return api;
      },
      endAt(value) {
        query.endAt = value;
        return api;
      },
      once(event) {
        if (event !== 'value') {
          return Promise.reject(new Error(`fakeRtdb: unsupported event ${event}`));
        }
        calls.push({ path, ...query });

        const value = valueAt(path);
        const key = path.split('/').filter(Boolean).pop() || null;
        let children = value !== null && typeof value === 'object' ? Object.entries(value) : [];

        if (query.orderByChild === undefined) {
          children.sort(([a], [b]) => compareKeys(a, b));
          return Promise.resolve(snapshot(key, value, children, false));
        }

        const childValue = ([, node]) =>
          node !== null && typeof node === 'object' ? node[query.orderByChild] : undefined;
        children = children
          .filter(entry => query.startAt === undefined || compareValues(childValue(entry), query.startAt) >= 0)
          .filter(entry => query.endAt === undefined || compareValues(childValue(entry), query.endAt) <= 0)
          .sort((a, b) => compareValues(childValue(a), childValue(b)) || compareKeys(a[0], b[0]));
        return Promise.resolve(snapshot(key, value, children, true));
      },
    };
    return api;
  }

  return { ref, calls };
}

module.exports = { createFakeRtdb };
