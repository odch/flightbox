import { connect } from 'react-redux';
import { getFormValues } from 'redux-form';
import FlightPage from '../components/wizards/DepartureWizard/pages/FlightPage';
import objectToArray from '../util/objectToArray';
import {getEnabledFlightTypes} from '../util/flightTypes';
import {getDepartureRoutes} from '../util/routes';
import isHelicopter from '../util/isHelicopter'

const runways = objectToArray(__CONF__.aerodrome.runways)
  .map(runway => ({
    label: runway.name,
    value: runway.name,
  }));

const departureRoutes = getDepartureRoutes();

const filter = (items, values) => items.filter(item => !item.available || item.available(values) === true);

const getHiddenFields = values => {
  const hiddenFields = []
  if (isHelicopter(values.immatriculation, values.aircraftCategory)) {
    hiddenFields.push('runway')
  }
  return hiddenFields
}

const mapStateToProps = (state, ownProps) => {
  const values = getFormValues('wizard')(state);
  return Object.assign({}, ownProps, {
    flightTypes: filter(getEnabledFlightTypes(), values),
    runways: filter(runways, values),
    departureRoutes: filter(departureRoutes, values),
    hiddenFields: getHiddenFields(values)
  });
};

const mapActionCreators = {
};

export default connect(mapStateToProps, mapActionCreators)(FlightPage);
