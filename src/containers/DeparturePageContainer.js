import { connect } from 'react-redux';
import { destroy } from 'redux-form';
import {
  nextPage,
  previousPage,
  finish,
  showCommitRequirementsDialog,
  hideCommitRequirementsDialog,
  unsetCommitError,
} from '../modules/ui/wizard';
import { initNewDeparture, initNewDepartureFromArrival, editDeparture, saveDeparture } from '../modules/movements/departures';
import DepartureWizard from '../components/wizards/DepartureWizard';

const mapStateToProps = (state, ownProps) => {
  return {
    auth: state.auth,
    route: ownProps.route,
    wizard: state.ui.wizard,
  };
};

const mapActionCreators = {
  initNewMovement: initNewDeparture,
  initNewDepartureFromArrival,
  editMovement: editDeparture,
  nextPage,
  previousPage,
  finish,
  showCommitRequirementsDialog,
  hideCommitRequirementsDialog,
  saveMovement: saveDeparture,
  unsetCommitError,
  destroyForm: destroy,
};

export default connect(mapStateToProps, mapActionCreators)(DepartureWizard);
