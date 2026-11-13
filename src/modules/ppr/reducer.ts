import * as actions from './actions';
import { PprAction, PprListScope } from './actions';
import reducer from '../../util/reducer';

interface PprFormState {
  submitting: boolean;
  submitted: boolean;
  commitFailed: boolean;
  reviewFailed: boolean;
  deleteFailed: boolean;
}

interface PprSettingsState {
  adminEmail: string | null;
  retentionDays: number | null;
  loaded: boolean;
  loadFailed: boolean;
  saving: boolean;
  saved: boolean;
  saveFailed: boolean;
}

interface PprState {
  data: unknown[];
  // Whose requests data holds: the pilot's own or all (admin list)
  scope: PprListScope | null;
  loading: boolean;
  selected: string | null;
  initialValues: Record<string, any>;
  form: PprFormState;
  settings: PprSettingsState;
}

const INITIAL_STATE: PprState = {
  data: [],
  scope: null,
  loading: false,
  selected: null,
  initialValues: {},
  form: {
    submitting: false,
    submitted: false,
    commitFailed: false,
    reviewFailed: false,
    deleteFailed: false,
  },
  settings: {
    adminEmail: null,
    retentionDays: null,
    loaded: false,
    loadFailed: false,
    saving: false,
    saved: false,
    saveFailed: false,
  },
};

function setLoading(state: PprState) {
  return Object.assign({}, state, {
    loading: true,
  });
}

function pprRequestsLoaded(state: PprState, action: PprAction & { type: typeof actions.PPR_REQUESTS_LOADED }) {
  return Object.assign({}, state, {
    data: action.payload.data,
    scope: action.payload.scope,
    loading: false,
    form: Object.assign({}, state.form, { deleteFailed: false, reviewFailed: false }),
  });
}

function formInitialized(state: PprState, action: PprAction & { type: typeof actions.PPR_FORM_INITIALIZED }) {
  return Object.assign({}, state, {
    initialValues: action.payload.initialValues,
  });
}

function loadFailed(state: PprState) {
  return Object.assign({}, state, {
    loading: false,
  });
}

function submitStarted(state: PprState) {
  return Object.assign({}, state, {
    form: Object.assign({}, state.form, { submitting: true, commitFailed: false }),
  });
}

function submitSuccess(state: PprState) {
  return Object.assign({}, state, {
    form: Object.assign({}, state.form, { submitting: false, submitted: true, commitFailed: false }),
  });
}

function submitFailure(state: PprState) {
  return Object.assign({}, state, {
    form: Object.assign({}, state.form, { submitting: false, submitted: false, commitFailed: true }),
  });
}

function reviewSuccess(state: PprState) {
  return Object.assign({}, state, {
    form: Object.assign({}, state.form, { reviewFailed: false }),
  });
}

function reviewFailure(state: PprState) {
  return Object.assign({}, state, {
    form: Object.assign({}, state.form, { reviewFailed: true }),
  });
}

function deleteFailure(state: PprState) {
  return Object.assign({}, state, {
    form: Object.assign({}, state.form, { deleteFailed: true }),
  });
}

function deleteSuccess(state: PprState, action: PprAction & { type: typeof actions.DELETE_PPR_REQUEST_SUCCESS }) {
  return Object.assign({}, state, {
    data: (state.data as any[]).filter((r: any) => r.key !== action.payload.key),
    selected: state.selected === action.payload.key ? null : state.selected,
  });
}

function selectRequest(state: PprState, action: PprAction & { type: typeof actions.SELECT_PPR_REQUEST }) {
  return Object.assign({}, state, {
    selected: action.payload.key,
  });
}

function resetForm(state: PprState) {
  return Object.assign({}, state, {
    form: INITIAL_STATE.form,
  });
}

function settingsLoaded(state: PprState, action: PprAction & { type: typeof actions.PPR_SETTINGS_LOADED }) {
  return Object.assign({}, state, {
    settings: Object.assign({}, state.settings, {
      adminEmail: action.payload.settings.adminEmail,
      retentionDays: action.payload.settings.retentionDays,
      loaded: true,
      loadFailed: false,
      // a fresh load starts without old save results (the PPR and privacy
      // tabs share this state)
      saved: false,
      saveFailed: false,
    }),
  });
}

function settingsLoadFailed(state: PprState) {
  return Object.assign({}, state, {
    settings: Object.assign({}, state.settings, { loadFailed: true }),
  });
}

function settingsSaving(state: PprState) {
  return Object.assign({}, state, {
    settings: Object.assign({}, state.settings, { saving: true, saved: false, saveFailed: false }),
  });
}

function settingsSaved(state: PprState, action: PprAction & { type: typeof actions.SAVE_PPR_SETTINGS_SUCCESS }) {
  return Object.assign({}, state, {
    settings: Object.assign({}, state.settings, {
      adminEmail: action.payload.settings.adminEmail,
      retentionDays: action.payload.settings.retentionDays,
      loaded: true,
      saving: false,
      saved: true,
    }),
  });
}

function settingsSaveFailed(state: PprState) {
  return Object.assign({}, state, {
    settings: Object.assign({}, state.settings, { saving: false, saveFailed: true }),
  });
}

const ACTION_HANDLERS = {
  [actions.PPR_FORM_INITIALIZED]: formInitialized,
  [actions.SET_PPR_LOADING]: setLoading,
  [actions.PPR_REQUESTS_LOADED]: pprRequestsLoaded,
  [actions.PPR_LOAD_FAILED]: loadFailed,
  [actions.SUBMIT_PPR_REQUEST]: submitStarted,
  [actions.SUBMIT_PPR_REQUEST_SUCCESS]: submitSuccess,
  [actions.SUBMIT_PPR_REQUEST_FAILURE]: submitFailure,
  [actions.REVIEW_PPR_REQUEST_SUCCESS]: reviewSuccess,
  [actions.REVIEW_PPR_REQUEST_FAILURE]: reviewFailure,
  [actions.DELETE_PPR_REQUEST_SUCCESS]: deleteSuccess,
  [actions.DELETE_PPR_REQUEST_FAILURE]: deleteFailure,
  [actions.SELECT_PPR_REQUEST]: selectRequest,
  [actions.RESET_PPR_FORM]: resetForm,
  [actions.PPR_SETTINGS_LOADED]: settingsLoaded,
  [actions.PPR_SETTINGS_LOAD_FAILED]: settingsLoadFailed,
  [actions.SAVE_PPR_SETTINGS]: settingsSaving,
  [actions.SAVE_PPR_SETTINGS_SUCCESS]: settingsSaved,
  [actions.SAVE_PPR_SETTINGS_FAILURE]: settingsSaveFailed,
};

// The pending requests of the admin list (shown on its admin tab); null
// while the list of all requests isn't loaded
export function getPendingPprCount(state: PprState): number | null {
  if (state.scope !== 'all') {
    return null;
  }
  return (state.data as any[]).filter(request => request && request.status === 'pending').length;
}

export type { PprState };
export default reducer<PprState, PprAction>(INITIAL_STATE, ACTION_HANDLERS);
