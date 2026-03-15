import {connect} from 'react-redux';
import {loadLockDate} from '../modules/settings/lockDate';
import MovementsPage from '../components/MovementsPage';
import {RootState} from '../modules';

const mapStateToProps = (state: RootState) => ({
  auth: state.auth,
  lockDate: state.settings.lockDate,
});

const mapActionCreators = {
  loadLockDate,
};

export default connect(mapStateToProps, mapActionCreators)(MovementsPage);
