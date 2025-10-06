const categories = [
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

const categoryNames = categories.map(category => category.name)

const isHelicopter = aircraftCategory => ['Hubschrauber', 'Eigenbauhubschrauber',].includes(aircraftCategory);

const flightTypeAircraftType = aircraftCategory => {
  if (!aircraftCategory) {
    return null
  }

  const category = categories.find(category => category.name === aircraftCategory)

  if (category) {
    return category.flightTypeAircraftType
  }
}

const icon = aircraftCategory => {
  if (!aircraftCategory) {
    return null
  }

  const category = categories.find(category => category.name === aircraftCategory)

  if (category) {
    return category.icon
  }
}

module.exports = {categories: categoryNames, isHelicopter, flightTypeAircraftType, icon} // no ES6 export as this file is also required in build process without ES6 support
