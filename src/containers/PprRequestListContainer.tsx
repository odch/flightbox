import { connect } from 'react-redux';
import { loadPprRequests, reviewPprRequest } from '../modules/ppr';
import PprRequestList from '../components/PprRequestList';
import { RootState } from '../modules';

const mapStateToProps = (state: RootState) => ({
  data: state.ppr.data,
  loading: state.ppr.loading,
  reviewFailed: state.ppr.form.reviewFailed,
});

const mapActionCreators = {
  loadPprRequests,
  reviewPprRequest,
};

export default connect(mapStateToProps, mapActionCreators)(PprRequestList);
