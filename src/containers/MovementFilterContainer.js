import { connect } from 'react-redux';
import { setMovementsFilter } from '../modules/movements';
import { setMovementsFilterExpanded } from '../modules/ui/movements';

import MovementFilter from '../components/MovementFilter';

const mapStateToProps = state => {
  return ({
    filter: state.movements.filter,
    expanded: state.ui.movements.filterExpanded
  });
}

const mapActionCreators = {
  setMovementsFilter,
  setExpanded: setMovementsFilterExpanded
};

export default connect(mapStateToProps, mapActionCreators)(MovementFilter);
