import { connect } from 'react-redux';
import { getFormValues } from 'redux-form';
import FlightPage from '../components/wizards/ArrivalWizard/pages/FlightPage';
import objectToArray from '../util/objectToArray';

const flightTypes = [
  {
    label: 'Privat',
    value: 'private',
  }, {
    label: 'Gewerblich',
    value: 'commercial',
  }, {
    label: 'Schulung',
    value: 'instruction',
  },
];

const runways = objectToArray(__CONF__.aerodrome.runways)
  .map(runway => ({
    label: runway,
    value: runway,
  }));

const arrivalRoutes = objectToArray(__CONF__.aerodrome.arrivalRoutes)
  .map(route => ({
    label: route.label,
    value: route.name,
  }));

arrivalRoutes.push({
  label: 'Platzrunden',
  value: 'circuits',
  description: 'Ohne Verlassen des Platzverkehrs',
  available: values => values.location && values.location.toUpperCase() === __CONF__.aerodrome.ICAO,
});

const filter = (items, values) => items.filter(item => !item.available || item.available(values) === true);

const mapStateToProps = (state, ownProps) => {
  const values = getFormValues('wizard')(state);
  return Object.assign({}, ownProps, {
    flightTypes: filter(flightTypes, values),
    runways: filter(runways, values),
    arrivalRoutes: filter(arrivalRoutes, values),
  });
};

const mapActionCreators = {
};

export default connect(mapStateToProps, mapActionCreators)(FlightPage);
