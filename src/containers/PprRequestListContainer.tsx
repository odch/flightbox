import { connect } from 'react-redux';
import { loadPprRequests, reviewPprRequest, revokePprApproval } from '../modules/ppr';
import PprRequestList from '../components/PprRequestList';
import { RootState } from '../modules';

const mapStateToProps = (state: RootState) => ({
  data: state.ppr.data,
  loading: state.ppr.loading,
  // data holds all requests (not those of the pilot's own list)
  loaded: state.ppr.scope === 'all',
  // The last load failed: data is that of an earlier load, if any
  loadFailed: state.ppr.loadFailed,
  // The settings above the list are shown, at their final height
  settingsReady: state.ppr.settings.loaded || state.ppr.settings.loadFailed,
  reviewFailed: state.ppr.form.reviewFailed,
  revokeFailed: state.ppr.form.revokeFailed,
});

const mapActionCreators = {
  loadPprRequests: () => loadPprRequests('all'),
  reviewPprRequest,
  revokePprApproval,
};

export default connect(mapStateToProps, mapActionCreators)(PprRequestList);
