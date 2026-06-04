import {connect} from 'react-redux';
import {setAerodromeStatusBannerEnabled} from '../modules/settings/aerodromeStatusBannerEnabled';
import AerodromeStatusBannerToggle from '../components/AerodromeStatusBannerToggle/AerodromeStatusBannerToggle';
import {RootState} from '../modules';

const mapStateToProps = (state: RootState) => ({
  enabled: state.settings.aerodromeStatusBannerEnabled.enabled,
  disabled: state.settings.aerodromeStatusBannerEnabled.saving === true,
});

const mapActionCreators = {
  setAerodromeStatusBannerEnabled
};

export default connect(mapStateToProps, mapActionCreators)(AerodromeStatusBannerToggle);
