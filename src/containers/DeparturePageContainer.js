import { connect } from 'react-redux';
import { nextPage, previousPage, finish, showCommitRequirementsDialog, hideCommitRequirementsDialog } from '../modules/ui/wizard';
import { initNewDeparture, saveDeparture } from '../modules/departures';
import DepartureWizard from '../components/DepartureWizard';

const mapStateToProps = (state, ownProps) => {
  return {
    auth: state.auth,
    route: ownProps.route,
    wizard: state.ui.wizard,
  };
};

const mapActionCreators = {
  initNewDeparture,
  nextPage,
  previousPage,
  finish,
  showCommitRequirementsDialog,
  hideCommitRequirementsDialog,
  saveDeparture,
};

export default connect(mapStateToProps, mapActionCreators)(DepartureWizard);
