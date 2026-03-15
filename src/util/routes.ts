import objectToArray from './objectToArray';
import isHelicopter from "./isHelicopter"
import i18n from '../i18n';

const helicopterCondition = values => isHelicopter(values.immatriculation, values.aircraftCategory)

const conditions = {
  helicopter: helicopterCondition,
  notHelicopter: values => !helicopterCondition(values)
}

const buildArray = routes => objectToArray(routes)
  .map((route: any) => ({
    label: route.label,
    value: route.name,
    available: route.condition ? conditions[route.condition] : undefined
  }));

const buildRoutes = () => {
  const circuitRoute = {
    label: i18n.t('routes.circuits'),
    value: 'circuits',
    available: values => values.location && values.location.toUpperCase() === __CONF__.aerodrome.ICAO,
  };
  return {
    arrivals: [...buildArray(__CONF__.aerodrome.arrivalRoutes), circuitRoute],
    departures: [...buildArray(__CONF__.aerodrome.departureRoutes), circuitRoute],
  };
};

const findByValue = (array, value) => {
  const obj = array.find(item => item.value === value);
  if (!obj) {
    console.log('Route "' + value + '" not found');
    return {
      value,
      label: value.charAt(0).toUpperCase() + value.slice(1)
    }
  }
  return obj;
};

export const getDepartureRoutes = () => buildRoutes().departures;

export const getArrivalRoutes = () => buildRoutes().arrivals;

export const getDepartureRouteLabel = route => findByValue(getDepartureRoutes(), route).label;

export const getArrivalRouteLabel = route => findByValue(getArrivalRoutes(), route).label;
