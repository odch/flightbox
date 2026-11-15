import { connect } from 'react-redux';
import { initPprForm, submitPprGuestRequest, resetPprForm } from '../modules/ppr';
import PprRequestPage from '../components/PprRequestPage';
import { RootState } from '../modules';

// The form without login: for guest sessions and logins without an email
// address
const mapStateToProps = (state: RootState) => ({
  submitting: state.ppr.form.submitting,
  submitted: state.ppr.form.submitted,
  result: state.ppr.form.result,
  commitFailed: state.ppr.form.commitFailed,
  rateLimited: state.ppr.form.rateLimited,
  initialValues: state.ppr.initialValues,
  withoutLogin: true,
});

const mapActionCreators = {
  initPprForm,
  onSubmit: submitPprGuestRequest,
  resetPprForm,
};

export default connect(mapStateToProps, mapActionCreators)(PprRequestPage);
