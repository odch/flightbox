import {connect} from 'react-redux';
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
  if (__CONF__.aerodrome.noRunwayIfHelicopter === true && isHelicopter(values.immatriculation, values.aircraftCategory)) {
    hiddenFields.push('runway')
  }
  return hiddenFields
}

const mapStateToProps = (state, ownProps) => {
  const values = state.ui.wizard.values;
  return Object.assign({}, ownProps, {
    flightTypes: filter(getEnabledFlightTypes(values.aircraftCategory), values),
    runways: filter(runways, values),
    departureRoutes: filter(departureRoutes, values),
    hiddenFields: getHiddenFields(values),
    departureRoute: values.departureRoute
  });
};

const mapActionCreators = {
};

export default connect(mapStateToProps, mapActionCreators)(FlightPage);
