import firebase from './firebase.js';
import parse from 'csv-parse';

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

function getMap(array, options) {
  const itemMap = {};

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

  return itemMap;
}

function updateExisting(firebaseRef, itemMap, options, callback) {
  firebaseRef.once('value', (snapshot) => {
    const existing = {};

    const keyColumn = findKey(options.columns);

    snapshot.forEach(firebaseRow => {
      const keyValue = firebaseRow.val()[keyColumn.firebase];

      const item = itemMap[keyValue];

      const childRef = firebaseRef.child(firebaseRow.key());

      if (!item) {
        childRef.remove();
      } else {
        childRef.set(item);
      }

      existing[keyValue] = true;
    });

    callback(existing);
  });
}

function addNew(firebaseRef, itemMap, existing, options) {
  const keyColumn = findKey(options.columns);

  for (const key in itemMap) {
    if (existing[key] !== true && itemMap.hasOwnProperty(key)) {
      const item = itemMap[key];
      if (keyColumn.isFirebaseKey === true) {
        firebaseRef.child(key).set(item);
      } else {
        firebaseRef.push(item);
      }
    }
  }
}

/**
 * @param csvString
 * @param options (marked with * is required)
 * - path* {String} (i.e. '/users')
 * - columns* {Array}
 * example:
 * columns: [
 *   { csv: 'UserName', firebase: 'memberNr', isKey: true },
 *   { csv: 'LastName', firebase: 'lastname' },
 *   { csv: 'FirstName', firebase: 'firstname' },
 *   { csv: 'PhoneMobile', firebase: 'phone' },
 * ]
 * @param callback
 */
function importCsv(csvString, options, callback) {
  const parseOptions = {
    skip_empty_lines: true,
  };
  parse(csvString, parseOptions, (err, output) => {
    const itemMap = getMap(output, options);

    firebase(options.path, (error, ref) => {
      updateExisting(ref, itemMap, options, existing => {
        addNew(ref, itemMap, existing, options);
        callback();
      });
    });
  });
}

export default importCsv;
