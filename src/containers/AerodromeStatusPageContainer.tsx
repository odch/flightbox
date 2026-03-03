import {connect} from 'react-redux';
import {watchCurrentAerodromeStatus} from '../modules/settings/aerodromeStatus';
import AerodromeStatusPage from '../components/AerodromeStatusPage';
import {RootState} from '../modules';

const mapStateToProps = (state: RootState) => ({
  status: state.settings.aerodromeStatus.current,
});

const mapActionCreators = {
  watchCurrentAerodromeStatus
};

export default connect(mapStateToProps, mapActionCreators)(AerodromeStatusPage);
