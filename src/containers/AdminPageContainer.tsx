import {connect} from 'react-redux';
import AdminPage from '../components/AdminPage';
import {checkCustomsAvailability} from '../modules/customs';
import {getPendingPprCount, loadPprRequests} from '../modules/ppr';
import {RootState} from '../modules';

const mapStateToProps = (state: RootState) => ({
  auth: state.auth,
  guestAccessToken: state.settings.guestAccessToken,
  kioskAccessToken: state.settings.kioskAccessToken,
  customsAvailable: state.customs.available,
  pprPendingCount: getPendingPprCount(state.ppr),
});

const mapActionCreators = {
  checkCustomsAvailability,
  loadPprRequests,
};

export default connect(mapStateToProps, mapActionCreators)(AdminPage);
