import * as actions from './actions';
import {
  PprAction,
  PprListScope,
  PprAnswerMode,
  PprClosure,
  PprRequestStatus,
  PprStatusLoadFailure,
  PprSubmitResult,
  PprWithdrawFailure,
} from './actions';
import reducer from '../../util/reducer';
import dates from '../../util/dates';
import { isOpenPprRequest } from './groups';

interface PprFormState {
  submitting: boolean;
  submitted: boolean;
  // the answer to the submission (pending, or answered right away)
  result: PprSubmitResult | null;
  commitFailed: boolean;
  // The server refused a request without login for too many requests
  rateLimited: boolean;
  reviewFailed: boolean;
  revokeFailed: boolean;
  deleteFailed: boolean;
}

// What the status page tells after a load or a withdrawal
type PprStatusNotice = 'withdrawn' | 'notFound' | 'answeredMeanwhile' | 'loadFailed' | 'withdrawFailed';

// The request of a status link, apart from the lists in data
interface PprStatusState {
  // Null while it loads, when the link leads to no request (any more) and
  // after the request was withdrawn
  request: PprRequestStatus | null;
  loading: boolean;
  withdrawing: boolean;
  notice: PprStatusNotice | null;
}

interface PprSettingsState {
  adminEmail: string | null;
  retentionDays: number | null;
  answerMode: PprAnswerMode;
  pilotInfo: string | null;
  closures: PprClosure[];
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
  // The last load of the requests failed: data still holds those of an
  // earlier load, if any
  loadFailed: boolean;
  selected: string | null;
  initialValues: Record<string, any>;
  form: PprFormState;
  settings: PprSettingsState;
  status: PprStatusState;
}

const INITIAL_STATE: PprState = {
  data: [],
  scope: null,
  loading: false,
  loadFailed: false,
  selected: null,
  initialValues: {},
  form: {
    submitting: false,
    submitted: false,
    result: null,
    commitFailed: false,
    rateLimited: false,
    reviewFailed: false,
    revokeFailed: false,
    deleteFailed: false,
  },
  settings: {
    adminEmail: null,
    retentionDays: null,
    answerMode: 'manual',
    pilotInfo: null,
    closures: [],
    loaded: false,
    loadFailed: false,
    saving: false,
    saved: false,
    saveFailed: false,
  },
  status: {
    request: null,
    loading: false,
    withdrawing: false,
    notice: null,
  },
};

function setLoading(state: PprState) {
  return Object.assign({}, state, {
    loading: true,
    loadFailed: false,
  });
}

function pprRequestsLoaded(state: PprState, action: PprAction & { type: typeof actions.PPR_REQUESTS_LOADED }) {
  return Object.assign({}, state, {
    data: action.payload.data,
    scope: action.payload.scope,
    loading: false,
    // also after a load that failed while this one was running
    loadFailed: false,
    form: Object.assign({}, state.form, { deleteFailed: false, reviewFailed: false, revokeFailed: false }),
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
    loadFailed: true,
  });
}

function submitStarted(state: PprState) {
  return Object.assign({}, state, {
    form: Object.assign({}, state.form, { submitting: true, commitFailed: false, rateLimited: false }),
  });
}

function submitSuccess(state: PprState, action: PprAction & { type: typeof actions.SUBMIT_PPR_REQUEST_SUCCESS }) {
  return Object.assign({}, state, {
    form: Object.assign({}, state.form, {
      submitting: false,
      submitted: true,
      result: action.payload ? action.payload.result : null,
      commitFailed: false,
    }),
  });
}

function submitFailure(state: PprState, action: PprAction & { type: typeof actions.SUBMIT_PPR_REQUEST_FAILURE }) {
  return Object.assign({}, state, {
    form: Object.assign({}, state.form, {
      submitting: false,
      submitted: false,
      commitFailed: true,
      rateLimited: action.payload.rateLimited,
    }),
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

function revokeSuccess(state: PprState) {
  return Object.assign({}, state, {
    form: Object.assign({}, state.form, { revokeFailed: false }),
  });
}

function revokeFailure(state: PprState) {
  return Object.assign({}, state, {
    form: Object.assign({}, state.form, { revokeFailed: true }),
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

// The answer settings as the server returns them, with the defaults for an
// older server that doesn't know them
function answerSettings(settings: Partial<PprSettingsState>) {
  return {
    answerMode: settings.answerMode === 'automatic' ? 'automatic' : 'manual',
    pilotInfo: settings.pilotInfo || null,
    closures: Array.isArray(settings.closures) ? settings.closures : [],
  };
}

function settingsLoaded(state: PprState, action: PprAction & { type: typeof actions.PPR_SETTINGS_LOADED }) {
  return Object.assign({}, state, {
    settings: Object.assign({}, state.settings, answerSettings(action.payload.settings), {
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
    settings: Object.assign({}, state.settings, answerSettings(action.payload.settings), {
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

const LOAD_NOTICES: Record<PprStatusLoadFailure, PprStatusNotice> = {
  notFound: 'notFound',
  failed: 'loadFailed',
};

const WITHDRAW_NOTICES: Record<PprWithdrawFailure, PprStatusNotice> = {
  notPending: 'answeredMeanwhile',
  notFound: 'notFound',
  failed: 'withdrawFailed',
};

// Also when the request is loaded again after it was answered in the
// meantime: the notice about that stays
function statusLoading(state: PprState) {
  return Object.assign({}, state, {
    status: Object.assign({}, state.status, { request: null, loading: true }),
  });
}

function statusLoaded(state: PprState, action: PprAction & { type: typeof actions.PPR_STATUS_LOADED }) {
  return Object.assign({}, state, {
    status: Object.assign({}, state.status, { request: action.payload.request, loading: false }),
  });
}

function statusLoadFailed(state: PprState, action: PprAction & { type: typeof actions.PPR_STATUS_LOAD_FAILED }) {
  return Object.assign({}, state, {
    status: Object.assign({}, state.status, {
      request: null,
      loading: false,
      notice: LOAD_NOTICES[action.payload.reason],
    }),
  });
}

function withdrawStarted(state: PprState) {
  return Object.assign({}, state, {
    status: Object.assign({}, state.status, { withdrawing: true, notice: null }),
  });
}

function withdrawSuccess(state: PprState) {
  return Object.assign({}, state, {
    status: Object.assign({}, state.status, { request: null, withdrawing: false, notice: 'withdrawn' }),
  });
}

// A request that no longer exists is no longer shown
function withdrawFailure(state: PprState, action: PprAction & { type: typeof actions.WITHDRAW_PPR_REQUEST_FAILURE }) {
  const { reason } = action.payload;
  return Object.assign({}, state, {
    status: Object.assign({}, state.status, {
      request: reason === 'notFound' ? null : state.status.request,
      withdrawing: false,
      notice: WITHDRAW_NOTICES[reason],
    }),
  });
}

function resetStatus(state: PprState) {
  return Object.assign({}, state, {
    status: INITIAL_STATE.status,
  });
}

const ACTION_HANDLERS = {
  [actions.PPR_FORM_INITIALIZED]: formInitialized,
  [actions.SET_PPR_LOADING]: setLoading,
  [actions.PPR_REQUESTS_LOADED]: pprRequestsLoaded,
  [actions.PPR_LOAD_FAILED]: loadFailed,
  [actions.SUBMIT_PPR_REQUEST]: submitStarted,
  [actions.SUBMIT_PPR_GUEST_REQUEST]: submitStarted,
  [actions.SUBMIT_PPR_REQUEST_SUCCESS]: submitSuccess,
  [actions.SUBMIT_PPR_REQUEST_FAILURE]: submitFailure,
  [actions.REVIEW_PPR_REQUEST_SUCCESS]: reviewSuccess,
  [actions.REVIEW_PPR_REQUEST_FAILURE]: reviewFailure,
  [actions.REVOKE_PPR_APPROVAL_SUCCESS]: revokeSuccess,
  [actions.REVOKE_PPR_APPROVAL_FAILURE]: revokeFailure,
  [actions.DELETE_PPR_REQUEST_SUCCESS]: deleteSuccess,
  [actions.DELETE_PPR_REQUEST_FAILURE]: deleteFailure,
  [actions.SELECT_PPR_REQUEST]: selectRequest,
  [actions.RESET_PPR_FORM]: resetForm,
  [actions.PPR_SETTINGS_LOADED]: settingsLoaded,
  [actions.PPR_SETTINGS_LOAD_FAILED]: settingsLoadFailed,
  [actions.SAVE_PPR_SETTINGS]: settingsSaving,
  [actions.SAVE_PPR_SETTINGS_SUCCESS]: settingsSaved,
  [actions.SAVE_PPR_SETTINGS_FAILURE]: settingsSaveFailed,
  [actions.LOAD_PPR_STATUS]: statusLoading,
  [actions.PPR_STATUS_LOADED]: statusLoaded,
  [actions.PPR_STATUS_LOAD_FAILED]: statusLoadFailed,
  [actions.WITHDRAW_PPR_REQUEST]: withdrawStarted,
  [actions.WITHDRAW_PPR_REQUEST_SUCCESS]: withdrawSuccess,
  [actions.WITHDRAW_PPR_REQUEST_FAILURE]: withdrawFailure,
  [actions.RESET_PPR_STATUS]: resetStatus,
};

// The open requests of the admin list (shown on its admin tab): those of
// its group "Offen", pending and planned for today or later. Null while the
// list of all requests isn't loaded.
export function getOpenPprCount(state: PprState, today: string = dates.localDate()): number | null {
  if (state.scope !== 'all') {
    return null;
  }
  return (state.data as any[]).filter(request => request && isOpenPprRequest(request, today)).length;
}

export type { PprState, PprStatusNotice };
export default reducer<PprState, PprAction>(INITIAL_STATE, ACTION_HANDLERS);
