import {connect} from 'react-redux';
import {updatePassword, updateUsername} from '../modules/ui/loginPage';
import {authenticate} from '../modules/auth';
import {hideLogin} from '../modules/ui/showLogin';

import UsernamePasswordLoginForm from '../components/LoginPage/UsernamePasswordLoginForm'

const mapStateToProps = state => {
  const { username, password } = state.ui.loginPage;
  const showCancel = state.ui.showLogin === true;

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

export default connect(mapStateToProps, mapActionCreators)(UsernamePasswordLoginForm);
