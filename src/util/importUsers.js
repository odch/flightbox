import importCsv from './importCsv.js';

function importUsers(csvString) {
  const options = {
    path: '/users',
    columns: [
      { csv: 'UserName', firebase: 'memberNr', isKey: true },
      { csv: 'LastName', firebase: 'lastname' },
      { csv: 'FirstName', firebase: 'firstname' },
      { csv: 'PhoneMobile', firebase: 'phone' },
      { csv: 'Email', firebase: 'email' },
    ],
  };
  return importCsv(csvString, options);
}

export default importUsers;
