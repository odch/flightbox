'use strict';

// Flight type and aircraft category tables used by the airstat report.
// Ports src/util/flightTypes.ts (value and airstatType only),
// aircraftCategoriesData.js (name and flightTypeAircraftType only),
// aircraftCategories.ts and isHelicopter.ts.
// Parity with the client is enforced by src/util/airstatOracles/tables.spec.js.

const deepFreeze = (list) => Object.freeze(list.map(item => {
  for (const value of Object.values(item)) {
    if (value && typeof value === 'object') {
      Object.freeze(value);
    }
  }
  return Object.freeze(item);
}));

const FLIGHT_TYPES = deepFreeze([
  { value: 'private', airstatType: { aircraft: 42, helicopter: 64, motor_glider: 53 } },
  { value: 'commercial', airstatType: { aircraft: 32, helicopter: 61 } },
  { value: 'instruction', airstatType: { aircraft: 43, helicopter: 62, motor_glider: 53 } },
  { value: 'aerotow', airstatType: { aircraft: 52, motor_glider: 52 } },
  { value: 'paradrop', airstatType: { aircraft: 35, helicopter: 65 } },
  { value: 'glider_private_aerotow', airstatType: { glider: 72 } },
  { value: 'glider_private_winch', airstatType: { glider: 74 } },
  { value: 'glider_private_self', airstatType: { glider: 75 } },
  { value: 'glider_instruction_aerotow', airstatType: { glider: 71 } },
  { value: 'glider_instruction_winch', airstatType: { glider: 73 } },
  { value: 'glider_instruction_self', airstatType: { glider: 75 } },
  { value: 'military', airstatType: { aircraft: 57, helicopter: 67 } },
  { value: 'sar', airstatType: { helicopter: 66 } },
]);

const AIRCRAFT_CATEGORIES = deepFreeze([
  { name: 'Flugzeug', flightTypeAircraftType: 'aircraft' },
  { name: 'Eigenbauflugzeug', flightTypeAircraftType: 'aircraft' },
  { name: 'Motorsegler', flightTypeAircraftType: 'motor_glider' },
  { name: 'Hubschrauber', flightTypeAircraftType: 'helicopter' },
  { name: 'Eigenbauhubschrauber', flightTypeAircraftType: 'helicopter' },
  { name: 'Segelflugzeug', flightTypeAircraftType: 'glider' },
  { name: 'Eigenbausegelflugzeug', flightTypeAircraftType: 'glider' },
  { name: 'Ballon (Heissluft)', flightTypeAircraftType: 'aircraft' },
  { name: 'Ballon (Gas)', flightTypeAircraftType: 'aircraft' },
  { name: 'Luftschiff (Heissluft)', flightTypeAircraftType: 'aircraft' },
  { name: 'Ultraleicht Tragschrauber', flightTypeAircraftType: 'aircraft' },
  { name: 'Ultraleichtflugzeug (3-Achsen gesteuert)', flightTypeAircraftType: 'aircraft' },
  { name: 'Trike', flightTypeAircraftType: 'aircraft' },
  { name: 'Ecolight', flightTypeAircraftType: 'aircraft' },
  { name: 'Eigenbautragschrauber', flightTypeAircraftType: 'aircraft' },
]);

const HELICOPTER_CATEGORIES = ['Hubschrauber', 'Eigenbauhubschrauber'];

// Deprecated heuristic for movements without a category. Deliberately
// unanchored, so 'D-HBXY' matches and 'HB-XAB' does not.
const HELICOPTER_REGISTRATION = /HB[XZ].*/;

// null for a falsy category, undefined for an unknown one.
const flightTypeAircraftType = (aircraftCategory) => {
  if (!aircraftCategory) {
    return null;
  }
  const category = AIRCRAFT_CATEGORIES.find(item => item.name === aircraftCategory);
  if (category) {
    return category.flightTypeAircraftType;
  }
  return undefined;
};

const findFlightType = (type) => {
  const flightType = FLIGHT_TYPES.find(item => item.value === type);
  if (!flightType) {
    throw new Error('Flight type "' + type + '" not found');
  }
  return flightType;
};

// undefined when the flight type does not exist for the category.
const getAirstatType = (flightType, aircraftCategory) =>
  findFlightType(flightType).airstatType[flightTypeAircraftType(aircraftCategory)];

const isHelicopter = (registration, aircraftCategory) =>
  !aircraftCategory
    ? HELICOPTER_REGISTRATION.test(registration)
    : HELICOPTER_CATEGORIES.includes(aircraftCategory);

module.exports = {
  FLIGHT_TYPES,
  AIRCRAFT_CATEGORIES,
  flightTypeAircraftType,
  getAirstatType,
  isHelicopter,
};
