import {connect} from 'react-redux';
import {authenticateAsGuest} from '../modules/auth';

import GuestTokenLogin from '../components/LoginPage/GuestTokenLogin'

const mapStateToProps = state => {
  return state.auth.guestAuthentication;
};

const mapActionCreators = {
  authenticate: authenticateAsGuest,
};

export default connect(mapStateToProps, mapActionCreators)(GuestTokenLogin);
