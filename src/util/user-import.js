import importCsv from './csv-import.js';

function importUsers(csvString, callback) {
  const options = {
    path: '/users',
    columns: [
      { csv: 'UserName', firebase: 'memberNr', isKey: true },
      { csv: 'LastName', firebase: 'lastname' },
      { csv: 'FirstName', firebase: 'firstname' },
      { csv: 'PhoneMobile', firebase: 'phone' },
    ],
  };
  importCsv(csvString, options, callback);
}

export default importUsers;
