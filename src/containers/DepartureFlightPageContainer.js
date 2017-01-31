import { connect } from 'react-redux';
import { getFormValues } from 'redux-form';
import FlightPage from '../components/wizards/DepartureWizard/pages/FlightPage';
import objectToArray from '../util/objectToArray';
import {getEnabledFlightTypes} from '../util/flightTypes';

const runways = objectToArray(__CONF__.aerodrome.runways)
  .map(runway => ({
    label: runway,
    value: runway,
  }));

const departureRoutes = objectToArray(__CONF__.aerodrome.departureRoutes)
  .map(route => ({
    label: route.label,
    value: route.name,
  }));

departureRoutes.push({
  label: 'Platzrunden',
  value: 'circuits',
  description: 'Ohne Verlassen des Platzverkehrs',
  available: values => values.location && values.location.toUpperCase() === __CONF__.aerodrome.ICAO,
});

const filter = (items, values) => items.filter(item => !item.available || item.available(values) === true);

const mapStateToProps = (state, ownProps) => {
  const values = getFormValues('wizard')(state);
  return Object.assign({}, ownProps, {
    flightTypes: filter(getEnabledFlightTypes(), values),
    runways: filter(runways, values),
    departureRoutes: filter(departureRoutes, values),
  });
};

const mapActionCreators = {
};

export default connect(mapStateToProps, mapActionCreators)(FlightPage);
