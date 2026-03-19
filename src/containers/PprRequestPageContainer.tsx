import { connect } from 'react-redux';
import { initPprForm, submitPprRequest, resetPprForm, confirmPprSubmitSuccess } from '../modules/ppr';
import PprRequestPage from '../components/PprRequestPage';
import { RootState } from '../modules';

const mapStateToProps = (state: RootState) => ({
  submitted: state.ppr.form.submitted,
  commitFailed: state.ppr.form.commitFailed,
  initialValues: state.ppr.initialValues,
});

const mapActionCreators = {
  initPprForm,
  submitPprRequest,
  resetPprForm,
  confirmPprSubmitSuccess,
};

export default connect(mapStateToProps, mapActionCreators)(PprRequestPage);
