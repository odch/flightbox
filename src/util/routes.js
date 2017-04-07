import objectToArray from './objectToArray';

const circuitRoute = {
  label: 'Platzrunden',
  value: 'circuits',
  description: 'Ohne Verlassen des Platzverkehrs',
  available: values => values.location && values.location.toUpperCase() === __CONF__.aerodrome.ICAO,
};

const buildArray = routes => objectToArray(routes)
  .map(route => ({
    label: route.label,
    value: route.name,
  }));

const arrivalRoutes = buildArray(__CONF__.aerodrome.arrivalRoutes);
const departureRoutes = buildArray(__CONF__.aerodrome.departureRoutes);

arrivalRoutes.push(circuitRoute);
departureRoutes.push(circuitRoute);

const findByValue = (array, value) => {
  const obj = array.find(item => item.value === value);
  if (!obj) {
    throw new Error('Route "' + value + '" not found');
  }
  return obj;
};

export const getDepartureRoutes = () => departureRoutes;

export const getArrivalRoutes = () => arrivalRoutes;

export const getDepartureRouteLabel = route => findByValue(departureRoutes, route).label;

export const getArrivalRouteLabel = route => findByValue(arrivalRoutes, route).label;
