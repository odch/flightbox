import {connect} from 'react-redux';

import GuestAccessBox from '../components/AdminPage/GuestAccessBox'

const mapStateToProps = state => {
  return {
    guestAccessToken: state.settings.guestAccessToken
  };
};

const mapActionCreators = {
};

export default connect(mapStateToProps, mapActionCreators)(GuestAccessBox);
