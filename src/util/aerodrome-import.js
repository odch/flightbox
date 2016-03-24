import importCsv from './csv-import.js';

function importAerodromes(csvString, callback) {
  const options = {
    path: '/aerodromes',
    columns: [
      { csv: 'Ident', isKey: true, isFirebaseKey: true },
      { csv: 'Type', firebase: 'type' },
      { csv: 'Name', firebase: 'name', modifications: ['uppercase'] },
      { csv: 'IsoCountry', firebase: 'country' },
    ],
  };
  importCsv(csvString, options, callback);
}

export default importAerodromes;
