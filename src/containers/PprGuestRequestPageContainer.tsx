import { connect } from 'react-redux';
import { initPprForm, submitPprGuestRequest, resetPprForm } from '../modules/ppr';
import PprRequestPage from '../components/PprRequestPage';
import { RootState } from '../modules';
import { httpsUrl } from '../util/httpsUrl';

// The form without login: for visitors, guest sessions and logins without
// an email address
const mapStateToProps = (state: RootState) => ({
  submitting: state.ppr.form.submitting,
  submitted: state.ppr.form.submitted,
  result: state.ppr.form.result,
  commitFailed: state.ppr.form.commitFailed,
  rateLimited: state.ppr.form.rateLimited,
  initialValues: state.ppr.initialValues,
  withoutLogin: true,
  visitor: state.auth.authenticated !== true,
  privacyPolicyUrl: httpsUrl(state.settings.privacyPolicyUrl.url),
});

const mapActionCreators = {
  initPprForm,
  onSubmit: submitPprGuestRequest,
  resetPprForm,
};

export default connect(mapStateToProps, mapActionCreators)(PprRequestPage);
