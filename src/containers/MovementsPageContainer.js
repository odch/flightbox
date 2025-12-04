import {connect} from 'react-redux';
import {loadLockDate} from '../modules/settings/lockDate';

import MovementsPage from '../components/MovementsPage';

const mapStateToProps = state => {
  return {
    auth: state.auth,
    lockDate: state.settings.lockDate
  };
};

const mapActionCreators = {
  loadLockDate
};

export default connect(mapStateToProps, mapActionCreators)(MovementsPage);
