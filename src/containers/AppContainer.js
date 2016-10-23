import { connect } from 'react-redux';

import App from '../components/App';

const mapStateToProps = state => {
  return {
    auth: state.auth,
    showLogin: state.ui.showLogin,
  };
};

const mapActionCreators = {
};

export default connect(mapStateToProps, mapActionCreators)(App);
