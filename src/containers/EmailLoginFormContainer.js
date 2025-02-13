import {connect} from 'react-redux';
import {updateEmail} from '../modules/ui/loginPage';
import {sendAuthenticationEmail} from '../modules/auth';
import {hideLogin} from '../modules/ui/showLogin';

import EmailLoginForm from '../components/LoginPage/EmailLoginForm'

const mapStateToProps = state => {
  const { email, emailSent } = state.ui.loginPage;
  const showCancel = state.ui.showLogin === true;

  let submitting = false;
  let failure = false;

  if (state.auth) {
    submitting = state.auth.submitting || false;
    failure = state.auth.failure || false;
  }

  return {
    email,
    submitting,
    failure,
    emailSent,
    showCancel,
  };
};

const mapActionCreators = {
  updateEmail,
  authenticate: sendAuthenticationEmail,
  onCancel: hideLogin,
};

export default connect(mapStateToProps, mapActionCreators)(EmailLoginForm);
