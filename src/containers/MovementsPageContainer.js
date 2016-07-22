import { connect } from 'react-redux';
import { loadDepartures } from '../modules/movements/departures';
import { loadArrivals } from '../modules/movements/arrivals';

import MovementsPage from '../components/MovementsPage';

const mapStateToProps = state => {
  return {
    movements: state.movements,
  };
};

const mapActionCreators = {
  loadDepartures,
  loadArrivals,
};

export default connect(mapStateToProps, mapActionCreators)(MovementsPage);
