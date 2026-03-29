import {connect} from 'react-redux';
import {updateEmail, resetOtp} from '../modules/ui/loginPage';
import {sendAuthenticationEmail, verifyOtpCode} from '../modules/auth';
import {hideLogin} from '../modules/ui/showLogin';
import EmailLoginForm from '../components/LoginPage/EmailLoginForm';
import {RootState} from '../modules';

const mapStateToProps = (state: RootState) => {
  const {email, emailSent} = state.ui.loginPage;
  const showCancel = state.ui.showLogin === true;

  let submitting = false;
  let failure = false;
  let otpVerificationFailure = false;

  if (state.auth) {
    submitting = state.auth.submitting || false;
    failure = state.auth.failure || false;
    otpVerificationFailure = state.auth.otpVerificationFailure || false;
  }

  return {
    email,
    submitting,
    failure,
    emailSent,
    showCancel,
    otpVerificationFailure,
  };
};

const mapActionCreators = {
  updateEmail,
  resetOtp,
  sendAuthenticationEmail,
  verifyOtpCode,
  onCancel: hideLogin,
};

export default connect(mapStateToProps, mapActionCreators)(EmailLoginForm);
