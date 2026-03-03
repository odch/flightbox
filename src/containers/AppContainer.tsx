import {connect} from 'react-redux';
import App from '../components/App';
import {RootState} from '../modules';

const mapStateToProps = (state: RootState) => ({
  auth: state.auth,
  showLogin: state.ui.showLogin,
});

const mapActionCreators = {};

export default connect(mapStateToProps, mapActionCreators)(App);
