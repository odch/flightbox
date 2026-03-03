import * as actions from './actions';
import { SettingsAircraftsAction } from './actions';
import reducer from '../../../util/reducer';

interface SettingsAircraftsState {
  [type: string]: Record<string, boolean>;
}

const INITIAL_STATE: SettingsAircraftsState = {};

function loadAircraftSettingsSuccess(state: SettingsAircraftsState, action: SettingsAircraftsAction & { type: typeof actions.LOAD_AIRCRAFT_SETTINGS_SUCCESS }) {
  return Object.assign({}, state, {
    [action.payload.type]: action.payload.aircrafts,
  });
}

const ACTION_HANDLERS = {
  [actions.LOAD_AIRCRAFT_SETTINGS_SUCCESS]: loadAircraftSettingsSuccess,
};

export type { SettingsAircraftsState };
export default reducer<SettingsAircraftsState, SettingsAircraftsAction>(INITIAL_STATE, ACTION_HANDLERS);
