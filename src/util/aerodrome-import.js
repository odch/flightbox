import importCsv from './csv-import.js';

function importAerodromes(csvString) {
  const options = {
    path: '/aerodromes',
    columns: [
      { csv: 'Ident', isKey: true, isFirebaseKey: true },
      { csv: 'Type', firebase: 'type' },
      { csv: 'Name', firebase: 'name', modifications: ['uppercase'] },
      { csv: 'IsoCountry', firebase: 'country' },
    ],
  };
  return importCsv(csvString, options);
}

export default importAerodromes;
