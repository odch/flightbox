import { connect } from 'react-redux';
import { getFormValues } from 'redux-form';
import FlightPage from '../components/wizards/ArrivalWizard/pages/FlightPage';
import objectToArray from '../util/objectToArray';
import {getEnabledFlightTypes} from '../util/flightTypes';
import {getArrivalRoutes} from '../util/routes';
import isHelicopter from "../util/isHelicopter"

const runways = objectToArray(__CONF__.aerodrome.runways)
  .map(runway => ({
    label: runway.name,
    value: runway.name,
  }));

const arrivalRoutes = getArrivalRoutes();

const filter = (items, values) => items.filter(item => !item.available || item.available(values) === true);

const getHiddenFields = values => {
  const hiddenFields = []
  if (__CONF__.aerodrome.noRunwayIfHelicopter === true && isHelicopter(values.immatriculation, values.aircraftCategory)) {
    hiddenFields.push('runway')
  }
  return hiddenFields
}

const mapStateToProps = (state, ownProps) => {
  const values = getFormValues('wizard')(state);
  return Object.assign({}, ownProps, {
    flightTypes: filter(getEnabledFlightTypes(), values),
    runways: filter(runways, values),
    arrivalRoutes: filter(arrivalRoutes, values),
    hiddenFields: getHiddenFields(values),
    arrivalRoute: values.arrivalRoute
  });
};

const mapActionCreators = {
};

export default connect(mapStateToProps, mapActionCreators)(FlightPage);
