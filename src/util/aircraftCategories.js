const categories = [
  {name: 'Flugzeug', flightTypeAircraftType: 'aircraft'},
  {name: 'Eigenbauflugzeug', flightTypeAircraftType: 'aircraft'},
  {name: 'Motorsegler', flightTypeAircraftType: 'motor_glider'},
  {name: 'Hubschrauber', flightTypeAircraftType: 'helicopter'},
  {name: 'Eigenbauhubschrauber', flightTypeAircraftType: 'helicopter'},
  {name: 'Segelflugzeug', flightTypeAircraftType: 'glider'},
  {name: 'Eigenbausegelflugzeug', flightTypeAircraftType: 'glider'},
  {name: 'Ballon (Heissluft)', flightTypeAircraftType: 'aircraft'},
  {name: 'Ballon (Gas)', flightTypeAircraftType: 'aircraft'},
  {name: 'Luftschiff (Heissluft)', flightTypeAircraftType: 'aircraft'},
  {name: 'Ultraleicht Tragschrauber', flightTypeAircraftType: 'aircraft'},
  {name: 'Ultraleichtflugzeug (3-Achsen gesteuert)', flightTypeAircraftType: 'aircraft'},
  {name: 'Trike', flightTypeAircraftType: 'aircraft'},
  {name: 'Ecolight', flightTypeAircraftType: 'aircraft'},
  {name: 'Eigenbautragschrauber', flightTypeAircraftType: 'aircraft'},
];

const categoryNames = categories.map(category => category.name)

const isHelicopter = aircraftCategory => ['Hubschrauber', 'Eigenbauhubschrauber',].includes(aircraftCategory);

const flightTypeAircraftType = aircraftCategory => {
  if (!aircraftCategory) {
    return null
  }

  const category =categories.find(category => category.name === aircraftCategory)

  if (category) {
    return category.flightTypeAircraftType
  }
}

module.exports = {categories: categoryNames, isHelicopter, flightTypeAircraftType} // no ES6 export as this file is also required in build process without ES6 support
