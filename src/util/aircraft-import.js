import importCsv from './csv-import.js';

function importAircrafts(csvString, callback) {
  const options = {
    path: '/aircrafts',
    columns: [
      { csv: 'Registration', isKey: true, isFirebaseKey: true },
      { csv: 'Type', firebase: 'type' },
      { csv: 'MTOW', firebase: 'mtow', modifications: ['parseint'] },
    ],
  };
  importCsv(csvString, options, callback);
}

export default importAircrafts;
