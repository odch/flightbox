import Config from 'Config';
import Firebase from 'firebase';
import parse from 'csv-parse';

function findIndex(row, name) {
  const index = row.indexOf(name);
  if (index === -1) {
    throw new Error('Required column "' + name + '" not found in row ' + row);
  }
  return index;
}

function getMap(array) {
  const userMap = {};

  const firstRow = array.shift();

  const userNameIndex = findIndex(firstRow, 'UserName');
  const lastNameIndex = findIndex(firstRow, 'LastName');
  const firstNameIndex = findIndex(firstRow, 'FirstName');
  const phoneMobileIndex = findIndex(firstRow, 'PhoneMobile');

  array.forEach(user => {
    const memberNr = user[userNameIndex];
    const lastname = user[lastNameIndex];
    const firstname = user[firstNameIndex];
    const phone = user[phoneMobileIndex];

    userMap[memberNr] = {
      memberNr,
      lastname,
      firstname,
      phone,
    };
  });

  return userMap;
}

function updateExisting(firebaseRef, userMap, callback) {
  firebaseRef.once('value', (snapshot) => {
    const existing = {};

    snapshot.forEach((firebaseRow) => {
      const memberNr = firebaseRow.val().memberNr;

      const user = userMap[memberNr];

      const childRef = firebaseRef.child(firebaseRow.key());

      if (!user) {
        childRef.remove();
      } else {
        childRef.set(user);
      }

      existing[memberNr] = true;
    });

    callback(existing);
  });
}

function addNew(firebaseRef, userMap, existing) {
  for (const memberNr in userMap) {
    if (existing[memberNr] !== true && userMap.hasOwnProperty(memberNr)) {
      firebaseRef.push(userMap[memberNr]);
    }
  }
}

function importUsers(csvString, callback) {
  parse(csvString, (err, output) => {
    const userMap = getMap(output);

    const firebaseRef = new Firebase(Config.firebaseUrl + '/users/');

    updateExisting(firebaseRef, userMap, existing => {
      addNew(firebaseRef, userMap, existing);
      callback();
    });
  });
}

export default importUsers;
