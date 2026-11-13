import { connect } from 'react-redux';
import { loadPprRequests, reviewPprRequest, revokePprApproval } from '../modules/ppr';
import PprRequestList from '../components/PprRequestList';
import { RootState } from '../modules';

const mapStateToProps = (state: RootState) => ({
  data: state.ppr.data,
  loading: state.ppr.loading,
  reviewFailed: state.ppr.form.reviewFailed,
  revokeFailed: state.ppr.form.revokeFailed,
});

const mapActionCreators = {
  loadPprRequests: () => loadPprRequests('all'),
  reviewPprRequest,
  revokePprApproval,
};

export default connect(mapStateToProps, mapActionCreators)(PprRequestList);
