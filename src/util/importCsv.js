import firebase from './firebase.js';
import {get, child, set, remove, push} from 'firebase/database';
import parseCsv from "./parseCsv.js";

function findIndex(row, name) {
  const index = row.indexOf(name);
  if (index === -1) {
    throw new Error('Required column "' + name + '" not found in row ' + row);
  }
  return index;
}

function findKey(columns) {
  return columns.find(column => column.isKey === true);
}

function modify(value, modification) {
  switch (modification) {
    case 'uppercase':
      return value.toUpperCase();
    case 'lowercase':
      return value.toLowerCase();
    case 'parseint':
      return parseInt(value, 10);
    default:
      throw new Error('Unsupported modification "' + modification + '"');
  }
}

function applyModifications(value, modifications) {
  let modifiedValue = value;

  if (modifications) {
    modifications.forEach(modification => {
      modifiedValue = modify(value, modification);
    });
  }

  return modifiedValue;
}

async function getMap(array, options) {
  let itemMap = {};

  const firstRow = array.shift();

  const indexes = {};
  options.columns.forEach(column => {
    indexes[column.csv] = findIndex(firstRow, column.csv);
  });

  const keyColumn = findKey(options.columns);

  array.forEach(item => {
    const data = {};

    options.columns.forEach(column => {
      if (column.firebase) {
        let value = item[indexes[column.csv]];
        value = applyModifications(value, column.modifications);
        data[column.firebase] = value;
      }
    });

    const keyColumnIndex = indexes[keyColumn.csv];
    const itemKey = item[keyColumnIndex];

    itemMap[itemKey] = data;
  });

  if (options.additionalEntriesPath) {
    const snapshot = await get(firebase(options.additionalEntriesPath));
    if (snapshot.exists()) {
      itemMap = {
        ...itemMap,
        ...snapshot.val()
      }
    }
  }

  return itemMap;
}

async function updateExisting(firebaseRef, itemMap, options) {
  const snapshot = await get(firebaseRef);
  const existing = {};
  const keyColumn = findKey(options.columns);

  snapshot.forEach(firebaseRow => {
    const keyValue = firebaseRow.val()[keyColumn.firebase];
    const item = itemMap[keyValue];
    const childRef = child(firebaseRef, firebaseRow.key);

    if (!item) {
      remove(childRef);
    } else {
      set(childRef, item);
    }

    existing[keyValue] = true;
  });

  return existing;
}

function addNew(firebaseRef, itemMap, existing, options) {
  const keyColumn = findKey(options.columns);

  for (const key in itemMap) {
    if (existing[key] !== true && itemMap.hasOwnProperty(key)) {
      const item = itemMap[key];
      if (keyColumn.isFirebaseKey === true) {
        set(child(firebaseRef, key), item);
      } else {
        push(firebaseRef, item);
      }
    }
  }
}

/**
 * @param csvString
 * @param options (marked with * is required)
 * - path* {String} (i.e. '/users'),
 * - additionalEntriesPath (i.e. '/settings/users/')
 * - columns* {Array}
 * example:
 * columns: [
 *   { csv: 'UserName', firebase: 'memberNr', isKey: true },
 *   { csv: 'LastName', firebase: 'lastname' },
 *   { csv: 'FirstName', firebase: 'firstname' },
 *   { csv: 'PhoneMobile', firebase: 'phone' },
 *   { csv: 'Email', firebase: 'email' },
 * ]
 */
async function importCsv(csvString, options) {
  const data = await parseCsv(csvString);
  const itemMap = await getMap(data, options);
  const dbRef = firebase(options.path);
  const existing = await updateExisting(dbRef, itemMap, options);
  addNew(dbRef, itemMap, existing, options);
}

export default importCsv;
