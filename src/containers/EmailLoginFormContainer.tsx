import {connect} from 'react-redux';
import {updateEmail, resetOtp} from '../modules/ui/loginPage';
import {sendAuthenticationEmail, verifyOtpCode, loginWithPasskey} from '../modules/auth';
import {hideLogin} from '../modules/ui/showLogin';
import EmailLoginForm from '../components/LoginPage/EmailLoginForm';
import {RootState} from '../modules';

const mapStateToProps = (state: RootState) => {
  const {email, emailSent} = state.ui.loginPage;
  const showCancel = state.ui.showLogin === true;

  let submitting = false;
  let failure = false;
  let otpVerificationFailure = false;
  let passkeyLoginSubmitting = false;
  let passkeyLoginFailure = false;

  if (state.auth) {
    submitting = state.auth.submitting || false;
    failure = state.auth.failure || false;
    otpVerificationFailure = state.auth.otpVerificationFailure || false;
    passkeyLoginSubmitting = (state.auth.passkeyLogin && state.auth.passkeyLogin.submitting) || false;
    passkeyLoginFailure = (state.auth.passkeyLogin && state.auth.passkeyLogin.failure) || false;
  }

  return {
    email,
    submitting,
    failure,
    emailSent,
    showCancel,
    otpVerificationFailure,
    passkeysEnabled: __CONF__.passkeysEnabled === true,
    passkeyLoginSubmitting,
    passkeyLoginFailure,
  };
};

const mapActionCreators = {
  updateEmail,
  resetOtp,
  sendAuthenticationEmail,
  verifyOtpCode,
  loginWithPasskey,
  onCancel: hideLogin,
};

export default connect(mapStateToProps, mapActionCreators)(EmailLoginForm);
