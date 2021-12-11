import objectToArray from './objectToArray';

const enabledTypes = objectToArray(__CONF__.enabledFlightTypes);

const flightTypes = [
  {
    label: 'Privat',
    value: 'private',
    airstatType: {
      aircraft: 42,
      helicopter: 64
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
      helicopter: 62
    },
  }, {
    label: 'Flugzeugschlepp',
    value: 'aerotow',
    airstatType: {
      aicraft: 52
    },
  }, {
    label: 'Paradrop',
    value: 'paradrop',
    airstatType: {
      aircraft: 35,
      helicopter: 65
    },
  },
];

const findByValue = type => {
  const obj = flightTypes.find(item => item.value === type);
  if (!obj) {
    throw new Error('Flight type "' + type + '" not found');
  }
  return obj;
};

export const getEnabledFlightTypes = () => flightTypes.filter(type => enabledTypes.includes(type.value));

export const getAirstatType = (type, isHelicopter) =>
  findByValue(type).airstatType[isHelicopter ? 'helicopter' : 'aircraft'];

export const getLabel = type => findByValue(type).label;
