// Source of truth for aircraft category data.
// Imported by aircraftCategories.ts (TS/webpack build) and
// processFirebaseRules.js (gulp build, which cannot load .ts files).
// Note: keep in sync with the map in `updateAircraftList.js`
module.exports = [
  {name: 'Flugzeug', flightTypeAircraftType: 'aircraft'},
  {name: 'Eigenbauflugzeug', flightTypeAircraftType: 'aircraft'},
  {name: 'Motorsegler', flightTypeAircraftType: 'motor_glider'},
  {name: 'Hubschrauber', flightTypeAircraftType: 'helicopter', icon: 'helicopter'},
  {name: 'Eigenbauhubschrauber', flightTypeAircraftType: 'helicopter', icon: 'helicopter'},
  {name: 'Segelflugzeug', flightTypeAircraftType: 'glider', icon: 'glider'},
  {name: 'Eigenbausegelflugzeug', flightTypeAircraftType: 'glider', icon: 'glider'},
  {name: 'Ballon (Heissluft)', flightTypeAircraftType: 'aircraft'},
  {name: 'Ballon (Gas)', flightTypeAircraftType: 'aircraft'},
  {name: 'Luftschiff (Heissluft)', flightTypeAircraftType: 'aircraft'},
  {name: 'Ultraleicht Tragschrauber', flightTypeAircraftType: 'aircraft'},
  {name: 'Ultraleichtflugzeug (3-Achsen gesteuert)', flightTypeAircraftType: 'aircraft'},
  {name: 'Trike', flightTypeAircraftType: 'aircraft'},
  {name: 'Ecolight', flightTypeAircraftType: 'aircraft'},
  {name: 'Eigenbautragschrauber', flightTypeAircraftType: 'aircraft'},
];
