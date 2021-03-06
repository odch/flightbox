import { connect } from 'react-redux';
import { getFormValues } from 'redux-form';
import FlightPage from '../components/wizards/DepartureWizard/pages/FlightPage';
import objectToArray from '../util/objectToArray';
import {getEnabledFlightTypes} from '../util/flightTypes';
import {getDepartureRoutes} from '../util/routes';

const runways = objectToArray(__CONF__.aerodrome.runways)
  .map(runway => ({
    label: runway,
    value: runway,
  }));

const departureRoutes = getDepartureRoutes();

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
