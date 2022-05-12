const categories = [
  'Flugzeug',
  'Eigenbauflugzeug',
  'Motorsegler',
  'Hubschrauber',
  'Eigenbauhubschrauber',
  'Segelflugzeug',
  'Eigenbausegelflugzeug',
  'Ballon (Heissluft)',
  'Ballon (Gas)',
  'Luftschiff (Heissluft)',
  'Ultraleicht Tragschrauber',
  'Ultraleichtflugzeug (3-Achsen gesteuert)',
  'Trike',
  'Ecolight',
  'Eigenbautragschrauber'
];

const isHelicopter = aircraftCategory => ['Hubschrauber', 'Eigenbauhubschrauber',].includes(aircraftCategory);

module.exports = {categories, isHelicopter} // no ES6 export as this file is also required in build process without ES6 support
