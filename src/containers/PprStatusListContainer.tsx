import { connect } from 'react-redux';
import { loadPprRequests, deletePprRequest } from '../modules/ppr';
import PprStatusList from '../components/PprStatusList';
import { RootState } from '../modules';

const mapStateToProps = (state: RootState) => ({
  data: state.ppr.data,
  loading: state.ppr.loading,
  deleteFailed: state.ppr.form.deleteFailed,
});

const mapActionCreators = {
  loadPprRequests,
  deletePprRequest,
};

export default connect(mapStateToProps, mapActionCreators)(PprStatusList);
