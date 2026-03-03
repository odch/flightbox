import {connect} from 'react-redux';
import {authenticateAsGuest} from '../modules/auth';
import GuestTokenLogin from '../components/LoginPage/GuestTokenLogin';
import {RootState} from '../modules';

const mapStateToProps = (state: RootState) => state.auth.guestAuthentication;

const mapActionCreators = {
  authenticate: authenticateAsGuest,
};

export default connect(mapStateToProps, mapActionCreators)(GuestTokenLogin);
