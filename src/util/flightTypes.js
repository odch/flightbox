import objectToArray from './objectToArray';
import {flightTypeAircraftType} from './aircraftCategories'
import i18n from '../i18n';

const enabledTypes = objectToArray(__CONF__.enabledFlightTypes);

const flightTypes = [
  {
    value: 'private',
    airstatType: {
      aircraft: 42,
      helicopter: 64,
      motor_glider: 53
    },
  }, {
    value: 'commercial',
    airstatType: {
      aircraft: 32,
      helicopter: 61
    },
  }, {
    value: 'instruction',
    airstatType: {
      aircraft: 43,
      helicopter: 62,
      motor_glider: 53
    },
  }, {
    value: 'aerotow',
    airstatType: {
      aircraft: 52,
      motor_glider: 52
    },
  }, {
    value: 'paradrop',
    airstatType: {
      aircraft: 35,
      helicopter: 65
    },
  }, {
    value: 'glider_private_aerotow',
    airstatType: {
      glider: 72,
    },
  }, {
    value: 'glider_private_winch',
    airstatType: {
      glider: 74,
    },
  }, {
    value: 'glider_private_self',
    airstatType: {
      glider: 75,
    },
  }, {
    value: 'glider_instruction_aerotow',
    airstatType: {
      glider: 71,
    },
  }, {
    value: 'glider_instruction_winch',
    airstatType: {
      glider: 73,
    },
  }, {
    value: 'glider_instruction_self',
    airstatType: {
      glider: 75,
    },
  }, {
    value: 'military',
    airstatType: {
      aircraft: 57,
      helicopter: 67
    }
  }, {
    value: 'sar',
    airstatType: {
      helicopter: 66
    }
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
  .filter(type => !!type.airstatType[flightTypeAircraftType(aircraftCategory)])
  .map(type => ({ ...type, label: i18n.t(`flightTypes.${type.value}`) }));

export const getAirstatType = (type, aircraftCategory) =>
  findByValue(type).airstatType[flightTypeAircraftType(aircraftCategory)];

export const getLabel = type => i18n.t(`flightTypes.${findByValue(type).value}`);

export const isHelicopterAirstatType = airstatType => !!flightTypes.find(
  flightType => flightType.airstatType.helicopter && flightType.airstatType.helicopter === airstatType
)

const flightTypeContainsAirstatType = (flightTypeIds, airstatType) => {
  for (const flightTypeId of flightTypeIds) {
    const flightType= flightTypes.find(type => type.value === flightTypeId)
    const containsAirstatType = Object.values(flightType.airstatType).includes(airstatType)
    if (containsAirstatType) {
      return true
    }
  }
  return false
}

export const isPrivateFlightAirstatType = airstatType => flightTypeContainsAirstatType(
  ['private', 'glider_private_aerotow', 'glider_private_winch', 'glider_private_self'],
  airstatType
)

export const isInstructionFlightAirstatType = airstatType => flightTypeContainsAirstatType(
  ['instruction', 'glider_instruction_aerotow', 'glider_instruction_winch', 'glider_instruction_self'],
  airstatType
)

export const isCommercialFlightAirstatType = airstatType => flightTypeContainsAirstatType(
  ['commercial'],
  airstatType
)
