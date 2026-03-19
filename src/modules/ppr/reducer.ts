import * as actions from './actions';
import { PprAction } from './actions';
import reducer from '../../util/reducer';

interface PprFormState {
  submitted: boolean;
  commitFailed: boolean;
  reviewFailed: boolean;
  deleteFailed: boolean;
}

interface PprState {
  data: unknown[];
  loading: boolean;
  selected: string | null;
  form: PprFormState;
}

const INITIAL_STATE: PprState = {
  data: [],
  loading: false,
  selected: null,
  form: {
    submitted: false,
    commitFailed: false,
    reviewFailed: false,
    deleteFailed: false,
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
    loading: false,
  });
}

function loadFailed(state: PprState) {
  return Object.assign({}, state, {
    loading: false,
  });
}

function submitSuccess(state: PprState) {
  return Object.assign({}, state, {
    form: Object.assign({}, state.form, { submitted: true, commitFailed: false }),
  });
}

function submitFailure(state: PprState) {
  return Object.assign({}, state, {
    form: Object.assign({}, state.form, { submitted: false, commitFailed: true }),
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

const ACTION_HANDLERS = {
  [actions.SET_PPR_LOADING]: setLoading,
  [actions.PPR_REQUESTS_LOADED]: pprRequestsLoaded,
  [actions.PPR_LOAD_FAILED]: loadFailed,
  [actions.SUBMIT_PPR_REQUEST_SUCCESS]: submitSuccess,
  [actions.SUBMIT_PPR_REQUEST_FAILURE]: submitFailure,
  [actions.REVIEW_PPR_REQUEST_SUCCESS]: reviewSuccess,
  [actions.REVIEW_PPR_REQUEST_FAILURE]: reviewFailure,
  [actions.DELETE_PPR_REQUEST_SUCCESS]: deleteSuccess,
  [actions.DELETE_PPR_REQUEST_FAILURE]: deleteFailure,
  [actions.SELECT_PPR_REQUEST]: selectRequest,
  [actions.RESET_PPR_FORM]: resetForm,
};

export type { PprState };
export default reducer<PprState, PprAction>(INITIAL_STATE, ACTION_HANDLERS);
