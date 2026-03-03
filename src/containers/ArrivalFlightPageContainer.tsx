import {connect} from 'react-redux';
import FlightPage from '../components/wizards/ArrivalWizard/pages/FlightPage';
import objectToArray from '../util/objectToArray';
import {getEnabledFlightTypes} from '../util/flightTypes';
import {getArrivalRoutes} from '../util/routes';
import isHelicopter from '../util/isHelicopter';
import {RootState} from '../modules';

const runways = objectToArray(__CONF__.aerodrome.runways)
  .map((runway: any) => ({
    label: runway.name,
    value: runway.name,
  }));

const arrivalRoutes = getArrivalRoutes();

const filter = (items: any[], values: any) =>
  items.filter(item => !item.available || item.available(values) === true);

const getHiddenFields = (values: any) => {
  const hiddenFields: string[] = [];
  if (
    __CONF__.aerodrome.noRunwayIfHelicopter === true &&
    isHelicopter(values.immatriculation, values.aircraftCategory)
  ) {
    hiddenFields.push('runway');
  }
  return hiddenFields;
};

const mapStateToProps = (state: RootState, ownProps: any) => {
  const values = state.ui.wizard.values;
  return Object.assign({}, ownProps, {
    flightTypes: filter(getEnabledFlightTypes(values.aircraftCategory as string), values),
    runways: filter(runways, values),
    arrivalRoutes: filter(arrivalRoutes, values),
    hiddenFields: getHiddenFields(values),
    arrivalRoute: values.arrivalRoute,
  });
};

const mapActionCreators = {};

export default connect(mapStateToProps, mapActionCreators)(FlightPage);
