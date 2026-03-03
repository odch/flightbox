import {connect} from 'react-redux';
import {loadLockDate, setLockDate} from '../modules/settings/lockDate';
import LockMovementsForm from '../components/LockMovementsForm';
import {RootState} from '../modules';

const mapStateToProps = (state: RootState) => ({
  lockDate: state.settings.lockDate,
});

const mapActionCreators = {
  loadLockDate,
  setLockDate,
};

export default connect(mapStateToProps, mapActionCreators)(LockMovementsForm);
