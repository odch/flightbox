import { connect } from 'react-redux';
import {
  initPprForm,
  submitPprRequest,
  resetPprForm,
  confirmPprSubmitSuccess,
  dismissPprSubmitFailure,
} from '../modules/ppr';
import PprRequestPage from '../components/PprRequestPage';
import { RootState } from '../modules';
import type { Aircraft } from '../modules/profile/migration';

const mapStateToProps = (state: RootState) => ({
  submitting: state.ppr.form.submitting,
  submitted: state.ppr.form.submitted,
  result: state.ppr.form.result,
  commitFailed: state.ppr.form.commitFailed,
  initialValues: state.ppr.initialValues,
  closures: state.ppr.form.closures,
  // the aircraft shortcuts, as in the movement wizards
  profileAircrafts: (typeof __CONF__ === 'undefined' || __CONF__.profileEnabled !== false)
    ? state.profile.profile?.aircrafts as Aircraft[] | undefined
    : undefined,
});

const mapActionCreators = {
  initPprForm,
  onSubmit: submitPprRequest,
  resetPprForm,
  dismissPprSubmitFailure,
  confirmPprSubmitSuccess,
};

export default connect(mapStateToProps, mapActionCreators)(PprRequestPage);
