import { connect } from 'react-redux';
import { loadPprSettings, savePprSettings } from '../modules/ppr';
import PprSettingsForm from '../components/PprSettingsForm';
import { RootState } from '../modules';

const mapStateToProps = (state: RootState) => ({
  settings: state.ppr.settings,
  // For the link to the PPR request with the guest access
  guestAccessToken: state.settings.guestAccessToken.token,
});

const mapActionCreators = {
  loadPprSettings,
  savePprSettings,
};

export default connect(mapStateToProps, mapActionCreators)(PprSettingsForm);
