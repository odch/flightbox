import {connect} from 'react-redux';
import {updateEmail} from '../modules/ui/loginPage';
import {completeEmailAuthentication, sendAuthenticationEmail} from '../modules/auth';
import {hideLogin} from '../modules/ui/showLogin';

import EmailLoginForm from '../components/LoginPage/EmailLoginForm'
import {isSignInWithEmail} from '../util/firebase'

const mapStateToProps = state => {
  const { email, emailSent } = state.ui.loginPage;
  const showCancel = state.ui.showLogin === true;

  let submitting = false;
  let failure = false;

  if (state.auth) {
    submitting = state.auth.submitting || false;
    failure = state.auth.failure || false;
  }

  const emailLoginParamsPresent = isSignInWithEmail()

  return {
    email,
    submitting,
    failure,
    emailSent,
    showCancel,
    emailLoginParamsPresent,
    emailLoginCompletionFailure: state.auth.emailAuthenticationCompletionFailure
  };
};

const mapActionCreators = {
  updateEmail,
  sendAuthenticationEmail,
  completeEmailAuthentication,
  onCancel: hideLogin,
};

export default connect(mapStateToProps, mapActionCreators)(EmailLoginForm);
