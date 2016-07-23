import { connect } from 'react-redux';
import { loadLockDate, setLockDate } from '../modules/settings/lockDate';

import LockMovementsForm from '../components/LockMovementsForm';

const mapStateToProps = state => {
  return {
    lockDate: state.settings.lockDate,
  };
};

const mapActionCreators = {
  loadLockDate,
  setLockDate,
};

export default connect(mapStateToProps, mapActionCreators)(LockMovementsForm);
