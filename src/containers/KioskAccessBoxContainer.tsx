import {connect} from 'react-redux';
import KioskAccessBox from '../components/AdminPage/KioskAccessBox';
import {RootState} from '../modules';

const mapStateToProps = (state: RootState) => ({
  kioskAccessToken: state.settings.kioskAccessToken,
});

const mapActionCreators = {};

export default connect(mapStateToProps, mapActionCreators)(KioskAccessBox);
