import { connect } from 'react-redux';
import { destroy } from 'redux-form';
import { nextPage, previousPage, finish } from '../modules/ui/wizard';
import { initNewArrival, initNewArrivalFromDeparture, editArrival, saveArrival } from '../modules/movements/arrivals';

import ArrivalWizard from '../components/wizards/ArrivalWizard';

const mapStateToProps = (state, ownProps) => {
  return {
    auth: state.auth,
    route: ownProps.route,
    wizard: state.ui.wizard,
  };
};

const mapActionCreators = {
  initNewMovement: initNewArrival,
  initNewArrivalFromDeparture,
  editMovement: editArrival,
  nextPage,
  previousPage,
  finish,
  saveMovement: saveArrival,
  destroyForm: destroy,
};

export default connect(mapStateToProps, mapActionCreators)(ArrivalWizard);
