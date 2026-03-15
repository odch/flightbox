import {connect} from 'react-redux';
import GuestAccessBox from '../components/AdminPage/GuestAccessBox';
import {RootState} from '../modules';

const mapStateToProps = (state: RootState) => ({
  guestAccessToken: state.settings.guestAccessToken,
});

const mapActionCreators = {};

export default connect(mapStateToProps, mapActionCreators)(GuestAccessBox);
