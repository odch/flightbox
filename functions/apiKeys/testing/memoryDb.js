'use strict';

// In-memory stand-in for the Admin SDK database in the API key specs:
// ref(path) with once('value'), set, remove and transaction. Like the SDK
// without a cache, a transaction first runs the update with null and runs
// it again with the stored value if that differs. Transactions run without
// interruption, so the SDK's abort on a concurrent write is not modelled.

const copy = value => (value === undefined || value === null ? null : JSON.parse(JSON.stringify(value)));

function createMemoryDb(data = {}) {
  const root = { value: copy(data) };

  const parts = path => path.split('/').filter(Boolean);

  const read = path => parts(path).reduce(
    (node, part) => (node !== null && typeof node === 'object' && part in node ? node[part] : null), root.value);

  const write = (path, value) => {
    const keys = parts(path);
    if (keys.length === 0) {
      root.value = copy(value);
      return;
    }
    let node = root.value || (root.value = {});
    keys.slice(0, -1).forEach(key => {
      if (node[key] === null || typeof node[key] !== 'object') {
        node[key] = {};
      }
      node = node[key];
    });
    const last = keys[keys.length - 1];
    if (value !== null && value !== undefined) {
      node[last] = copy(value);
      return;
    }
    delete node[last];
    // Like the database, drop parents that are left empty.
    for (let depth = keys.length - 1; depth > 0; depth--) {
      const parent = keys.slice(0, depth - 1).reduce((current, key) => current[key], root.value);
      const key = keys[depth - 1];
      if (Object.keys(parent[key]).length > 0) {
        break;
      }
      delete parent[key];
    }
    if (Object.keys(root.value).length === 0) {
      root.value = null;
    }
  };

  const snapshot = (path, value) => ({
    key: parts(path).pop() || null,
    exists: () => value !== null,
    val: () => copy(value),
    forEach(callback) {
      const entries = value !== null && typeof value === 'object' ? Object.entries(value) : [];
      for (const [key, child] of entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) {
        if (callback(snapshot(`${path}/${key}`, child))) {
          return true;
        }
      }
      return false;
    },
  });

  function ref(path) {
    return {
      once: async event => {
        if (event !== 'value') {
          throw new Error(`memoryDb: unsupported event ${event}`);
        }
        return snapshot(path, copy(read(path)));
      },
      set: async value => write(path, value),
      remove: async () => write(path, null),
      transaction: async update => {
        let expected = null;
        for (;;) {
          const result = update(copy(expected));
          if (result === undefined) {
            return { committed: false, snapshot: snapshot(path, copy(read(path))) };
          }
          const stored = copy(read(path));
          if (JSON.stringify(stored) !== JSON.stringify(expected)) {
            expected = stored;
            continue;
          }
          write(path, result);
          return { committed: true, snapshot: snapshot(path, copy(read(path))) };
        }
      },
    };
  }

  return { ref, read };
}

module.exports = { createMemoryDb };
