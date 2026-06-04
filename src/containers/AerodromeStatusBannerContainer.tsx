import {connect} from 'react-redux';
import {watchCurrentAerodromeStatus} from '../modules/settings/aerodromeStatus';
import AerodromeStatusBanner from '../components/AerodromeStatusBanner/AerodromeStatusBanner';
import {RootState} from '../modules';

const mapStateToProps = (state: RootState) => ({
  status: state.settings.aerodromeStatus.current,
  enabled: state.settings.aerodromeStatusBannerEnabled.enabled,
});

const mapActionCreators = {
  watchCurrentAerodromeStatus
};

export default connect(mapStateToProps, mapActionCreators)(AerodromeStatusBanner);
