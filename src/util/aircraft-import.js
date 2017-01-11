import importCsv from './csv-import.js';

function importAircrafts(csvString) {
  const options = {
    path: '/aircrafts',
    columns: [
      { csv: 'Registration', isKey: true, isFirebaseKey: true },
      { csv: 'Type', firebase: 'type' },
      { csv: 'MTOW', firebase: 'mtow', modifications: ['parseint'] },
    ],
  };
  return importCsv(csvString, options);
}

export default importAircrafts;
