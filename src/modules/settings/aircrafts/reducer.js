import * as actions from './actions';
import reducer from '../../../util/reducer';

const INITIAL_STATE = {
};

function loadAircraftSettingsSuccess(state, action) {
  return Object.assign({}, state, {
    [action.payload.type]: action.payload.aircrafts,
  });
}

const ACTION_HANDLERS = {
  [actions.LOAD_AIRCRAFT_SETTINGS_SUCCESS]: loadAircraftSettingsSuccess,
};

export default reducer(INITIAL_STATE, ACTION_HANDLERS);
