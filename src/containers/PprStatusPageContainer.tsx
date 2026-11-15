import { connect } from 'react-redux';
import { loadPprStatus, withdrawPprRequest, resetPprStatus } from '../modules/ppr';
import PprStatusPage from '../components/PprStatusPage';
import { RootState } from '../modules';
import { getPprAccess } from '../modules/ppr/access';

// Who can make a new request from the status page (the kiosk never sees it)
const CAN_REQUEST = ['member', 'visitor', 'guest'];

const mapStateToProps = (state: RootState) => ({
  request: state.ppr.status.request,
  loading: state.ppr.status.loading,
  withdrawing: state.ppr.status.withdrawing,
  notice: state.ppr.status.notice,
  visitor: state.auth.authenticated !== true,
  canRequest: CAN_REQUEST.includes(getPprAccess(state.auth)),
});

const mapActionCreators = {
  loadPprStatus,
  withdrawPprRequest,
  resetPprStatus,
};

export default connect(mapStateToProps, mapActionCreators)(PprStatusPage);
