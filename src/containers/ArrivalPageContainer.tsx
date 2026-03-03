import {connect} from 'react-redux';
import {
  finish,
  hideDialog,
  nextPage,
  previousPage,
  showDialog,
  unsetCommitError,
  updateValues,
} from '../modules/ui/wizard';
import {cancelWizard} from '../modules/ui/movements';
import {
  editMovement,
  initNewMovement,
  initNewMovementFromMovement,
  saveMovement,
} from '../modules/movements';
import {loadLockDate} from '../modules/settings/lockDate';
import {loadAircraftSettings} from '../modules/settings/aircrafts';
import {isLocked} from '../util/movements';
import ArrivalWizard from '../components/wizards/ArrivalWizard';
import {RootState} from '../modules';

const mapStateToProps = (state: RootState, ownProps: any) => {
  let lockDateLoading = true;
  let locked = true;

  const lockDateState = state.settings.lockDate;
  if (lockDateState && state.ui.wizard.initialized === true) {
    lockDateLoading = lockDateState.loading;
    locked = isLocked(state.ui.wizard.values as any, lockDateState.date);
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
  updateValues,
  nextPage,
  previousPage,
  cancel: cancelWizard,
  finish,
  saveMovement,
  unsetCommitError,
  loadLockDate,
  loadAircraftSettings,
  showDialog,
  hideDialog,
};

export default connect(mapStateToProps, mapActionCreators)(ArrivalWizard);
