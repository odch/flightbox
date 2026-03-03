// Note: this list must be kept in sync with the map in `updateAircraftList.js`
const allCategories = [
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

const categoryNames = allCategories.map(category => category.name)

const isHelicopter = (aircraftCategory: string) => ['Hubschrauber', 'Eigenbauhubschrauber',].includes(aircraftCategory);

const flightTypeAircraftType = (aircraftCategory: string | null) => {
  if (!aircraftCategory) {
    return null
  }

  const category = allCategories.find(category => category.name === aircraftCategory)

  if (category) {
    return category.flightTypeAircraftType
  }
}

const icon = (aircraftCategory: string | null) => {
  if (!aircraftCategory) {
    return null
  }

  const category = allCategories.find(category => category.name === aircraftCategory)

  if (category) {
    return category.icon
  }
}

export const categories = categoryNames;
export { isHelicopter, flightTypeAircraftType, icon };
