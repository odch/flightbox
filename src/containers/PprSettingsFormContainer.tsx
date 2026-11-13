import { connect } from 'react-redux';
import { loadPprSettings, savePprSettings } from '../modules/ppr';
import PprSettingsForm from '../components/PprSettingsForm';
import { RootState } from '../modules';

const mapStateToProps = (state: RootState) => ({
  settings: state.ppr.settings,
});

const mapActionCreators = {
  loadPprSettings,
  savePprSettings,
};

export default connect(mapStateToProps, mapActionCreators)(PprSettingsForm);
