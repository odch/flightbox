import {connect} from 'react-redux';
import {watchCurrentAerodromeStatus} from '../modules/settings/aerodromeStatus';
import AerodromeStatusPage from '../components/AerodromeStatusPage';

const mapStateToProps = state => ({
  status: state.settings.aerodromeStatus.current,
});

const mapActionCreators = {
  watchCurrentAerodromeStatus
};

export default connect(mapStateToProps, mapActionCreators)(AerodromeStatusPage);
