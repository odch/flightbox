import objectToArray from './objectToArray';
import {flightTypeAircraftType} from './aircraftCategories'

const enabledTypes = objectToArray(__CONF__.enabledFlightTypes);

const flightTypes = [
  {
    label: 'Privat',
    value: 'private',
    airstatType: {
      aircraft: 42,
      helicopter: 64,
      motor_glider: 53
    },
  }, {
    label: 'Gewerblich',
    value: 'commercial',
    airstatType: {
      aircraft: 32,
      helicopter: 61
    },
  }, {
    label: 'Schulung',
    value: 'instruction',
    airstatType: {
      aircraft: 43,
      helicopter: 62,
      motor_glider: 53
    },
  }, {
    label: 'Flugzeugschlepp',
    value: 'aerotow',
    airstatType: {
      aircraft: 52,
      motor_glider: 52
    },
  }, {
    label: 'Paradrop',
    value: 'paradrop',
    airstatType: {
      aircraft: 35,
      helicopter: 65
    },
  }, {
    label: 'Privat (Schlepp)',
    value: 'glider_private_aerotow',
    airstatType: {
      glider: 72,
    },
  }, {
    label: 'Privat (Winde)',
    value: 'glider_private_winch',
    airstatType: {
      glider: 74,
    },
  }, {
    label: 'Privat (Selbststart)',
    value: 'glider_private_self',
    airstatType: {
      glider: 75,
    },
  }, {
    label: 'Schulung (Schlepp)',
    value: 'glider_instruction_aerotow',
    airstatType: {
      glider: 71,
    },
  }, {
    label: 'Schulung (Winde)',
    value: 'glider_instruction_winch',
    airstatType: {
      glider: 73,
    },
  }, {
    label: 'Schulung (Selbststart)',
    value: 'glider_instruction_self',
    airstatType: {
      glider: 75,
    },
  }
];

const findByValue = type => {
  const obj = flightTypes.find(item => item.value === type);
  if (!obj) {
    throw new Error('Flight type "' + type + '" not found');
  }
  return obj;
};

export const getEnabledFlightTypes = (aircraftCategory) => flightTypes
  .filter(type => enabledTypes.includes(type.value))
  .filter(type => !!type.airstatType[flightTypeAircraftType(aircraftCategory)]);

export const getAirstatType = (type, aircraftCategory) =>
  findByValue(type).airstatType[flightTypeAircraftType(aircraftCategory)];

export const getLabel = type => findByValue(type).label;

export const isHelicopterAirstatType = airstatType => !!flightTypes.find(
  flightType => flightType.airstatType.helicopter && flightType.airstatType.helicopter === airstatType
)
