import {connect} from 'react-redux';

import KioskAccessBox from '../components/AdminPage/KioskAccessBox'

const mapStateToProps = state => {
  return {
    kioskAccessToken: state.settings.kioskAccessToken
  };
};

const mapActionCreators = {
};

export default connect(mapStateToProps, mapActionCreators)(KioskAccessBox);
