import {connect} from 'react-redux';
import {destroy, getFormValues} from 'redux-form';
import {finish, hideDialog, nextPage, previousPage, showDialog, unsetCommitError,} from '../modules/ui/wizard';
import {cancelWizard} from '../modules/ui/movements';
import {editMovement, initNewMovement, initNewMovementFromMovement, saveMovement} from '../modules/movements';
import {loadLockDate} from '../modules/settings/lockDate';
import {loadAircraftSettings} from '../modules/settings/aircrafts';
import {isLocked} from '../util/movements';
import ArrivalPaymentPage from '../components/wizards/ArrivalWizard/ArrivalPaymentPage';
import {setStep} from '../modules/ui/arrivalPayment'

const mapStateToProps = (state, ownProps) => {
  let lockDateLoading = true;
  let locked = true;

  const lockDateState = state.settings.lockDate;
  if (lockDateState && state.ui.wizard.initialized === true) {
    lockDateLoading = lockDateState.loading;
    locked = isLocked(getFormValues('wizard')(state), lockDateState.date);
  }

  return {
    auth: state.auth,
    route: ownProps.route,
    wizard: state.ui.wizard,
    lockDateLoading,
    locked,
  };
};

const mapActionCreators = {
  initNewMovement,
  initNewMovementFromMovement,
  editMovement,
  nextPage,
  previousPage,
  cancel: cancelWizard,
  finish,
  saveMovement,
  unsetCommitError,
  destroyForm: destroy,
  loadLockDate,
  loadAircraftSettings,
  showDialog,
  hideDialog,
  setStep
};

export default connect(mapStateToProps, mapActionCreators)(ArrivalPaymentPage);
