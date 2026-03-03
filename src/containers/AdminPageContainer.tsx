import {connect} from 'react-redux';
import AdminPage from '../components/AdminPage';
import {RootState} from '../modules';

const mapStateToProps = (state: RootState) => ({
  auth: state.auth,
  guestAccessToken: state.settings.guestAccessToken,
  kioskAccessToken: state.settings.kioskAccessToken,
});

const mapActionCreators = {};

export default connect(mapStateToProps, mapActionCreators)(AdminPage);
