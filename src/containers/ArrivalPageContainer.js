import { connect } from 'react-redux';
import { destroy, getFormValues } from 'redux-form';
import {
  nextPage,
  previousPage,
  finish,
  unsetCommitError,
  showDialog,
  hideDialog,
} from '../modules/ui/wizard';
import { cancelWizard } from '../modules/ui/movements';
import {
  initNewMovement,
  initNewMovementFromMovement,
  editMovement,
  saveMovement
} from '../modules/movements';
import { loadLockDate } from '../modules/settings/lockDate';
import { isLocked } from '../util/movements';
import ArrivalWizard from '../components/wizards/ArrivalWizard';

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
  showDialog,
  hideDialog,
};

export default connect(mapStateToProps, mapActionCreators)(ArrivalWizard);
