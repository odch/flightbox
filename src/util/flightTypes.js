import objectToArray from './objectToArray';

const enabledTypes = objectToArray(__CONF__.enabledFlightTypes);

const flightTypes = [
  {
    label: 'Privat',
    value: 'private',
    airstatType: 42,
  }, {
    label: 'Gewerblich',
    value: 'commercial',
    airstatType: 32,
  }, {
    label: 'Schulung',
    value: 'instruction',
    airstatType: 43,
  }, {
    label: 'Flugzeugschlepp',
    value: 'aerotow',
    airstatType: 52,
  }, {
    label: 'Paradrop',
    value: 'paradrop',
    airstatType: 35,
  },
];

export const getEnabledFlightTypes = () => flightTypes.filter(type => enabledTypes.includes(type.value));

export const getAirstatType = type => flightTypes.find(item => item.value === type).airstatType;
