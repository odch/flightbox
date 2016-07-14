import { connect } from 'react-redux';
import { updateUsername, updatePassword } from '../modules/loginPage';
import { authenticate } from '../modules/auth';
import { hideLogin } from '../modules/showLogin';

import LoginPage from '../components/LoginPage';

const mapStateToProps = state => {
  const { username, password } = state.loginPage;
  const showCancel = state.showLogin === true;

  let submitting = false;
  let failure = false;

  if (state.auth) {
    submitting = state.auth.submitting || false;
    failure = state.auth.failure || false;
  }

  return {
    username,
    password,
    submitting,
    failure,
    showCancel,
  };
};

const mapActionCreators = {
  updateUsername,
  updatePassword,
  authenticate,
  onCancel: hideLogin,
};

export default connect(mapStateToProps, mapActionCreators)(LoginPage);
