import {connect} from 'react-redux';
import {
  loadAerodromeStatus,
  updateAerodromeStatus,
  saveAerodromeStatus,
  selectAerodromeStatus,
} from '../modules/settings/aerodromeStatus';
import AerodromeStatusForm from '../components/AerodromeStatusForm';
import {RootState} from '../modules';

const isDirty = (data: any, latest: any) => {
  if (latest.array.length > 0) {
    const current = latest.array[0];
    return current.status !== data.status || current.details !== data.details;
  }
  return !!data.status;
};

const mapStateToProps = (state: RootState) => ({
  data: state.settings.aerodromeStatus.data,
  disabled:
    state.settings.aerodromeStatus.saving === true ||
    state.settings.aerodromeStatus.loading === true,
  dirty: isDirty(
    state.settings.aerodromeStatus.data,
    state.settings.aerodromeStatus.latest,
  ),
  latest: state.settings.aerodromeStatus.latest,
  selected: state.settings.aerodromeStatus.selected,
});

const mapActionCreators = {
  loadAerodromeStatus,
  updateAerodromeStatus,
  saveAerodromeStatus,
  selectAerodromeStatus,
};

export default connect(mapStateToProps, mapActionCreators)(AerodromeStatusForm);
