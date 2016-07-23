import { connect } from 'react-redux';
import { loadDepartures } from '../modules/movements/departures';
import { loadArrivals } from '../modules/movements/arrivals';
import { loadLockDate } from '../modules/settings/lockDate';

import MovementsPage from '../components/MovementsPage';

const mapStateToProps = state => {
  return {
    movements: state.movements,
    lockDate: state.settings.lockDate,
  };
};

const mapActionCreators = {
  loadDepartures,
  loadArrivals,
  loadLockDate,
};

export default connect(mapStateToProps, mapActionCreators)(MovementsPage);
