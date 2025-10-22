import {connect} from 'react-redux';

import AdminPage from '../components/AdminPage';

const mapStateToProps = state => {
  return {
    auth: state.auth,
    guestAccessToken: state.settings.guestAccessToken
  };
};

const mapActionCreators = {
};

export default connect(mapStateToProps, mapActionCreators)(AdminPage);
