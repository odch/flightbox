import {connect} from 'react-redux';
import {logout} from '../modules/auth';
import {showLogin} from '../modules/ui/showLogin';
import StartPage from '../components/StartPage';
import {RootState} from '../modules';

const mapStateToProps = (state: RootState) => ({
  auth: state.auth,
});

const mapActionCreators = {
  logout,
  showLogin,
};

export default connect(mapStateToProps, mapActionCreators)(StartPage);
