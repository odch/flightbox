import { connect } from 'react-redux';
import { destroy, getFormValues } from 'redux-form';
import {
  nextPage,
  previousPage,
  finish,
  showDialog,
  hideDialog,
  unsetCommitError,
} from '../modules/ui/wizard';
import { cancelWizard } from '../modules/ui/movements';
import { initNewDeparture, initNewDepartureFromArrival, editDeparture, saveDeparture } from '../modules/movements/departures';
import { loadLockDate } from '../modules/settings/lockDate';
import DepartureWizard from '../components/wizards/DepartureWizard';
import { isLocked } from '../util/movements';

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
  initNewMovement: initNewDeparture,
  initNewDepartureFromArrival,
  editMovement: editDeparture,
  nextPage,
  previousPage,
  cancel: cancelWizard,
  finish,
  showDialog,
  hideDialog,
  saveMovement: saveDeparture,
  unsetCommitError,
  destroyForm: destroy,
  loadLockDate,
};

export default connect(mapStateToProps, mapActionCreators)(DepartureWizard);
