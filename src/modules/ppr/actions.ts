export const LOAD_PPR_REQUESTS = 'LOAD_PPR_REQUESTS' as const;
export const SET_PPR_LOADING = 'SET_PPR_LOADING' as const;
export const PPR_REQUESTS_LOADED = 'PPR_REQUESTS_LOADED' as const;
export const SUBMIT_PPR_REQUEST = 'SUBMIT_PPR_REQUEST' as const;
export const SUBMIT_PPR_REQUEST_SUCCESS = 'SUBMIT_PPR_REQUEST_SUCCESS' as const;
export const SUBMIT_PPR_REQUEST_FAILURE = 'SUBMIT_PPR_REQUEST_FAILURE' as const;
export const REVIEW_PPR_REQUEST = 'REVIEW_PPR_REQUEST' as const;
export const REVIEW_PPR_REQUEST_SUCCESS = 'REVIEW_PPR_REQUEST_SUCCESS' as const;
export const REVIEW_PPR_REQUEST_FAILURE = 'REVIEW_PPR_REQUEST_FAILURE' as const;
export const DELETE_PPR_REQUEST = 'DELETE_PPR_REQUEST' as const;
export const DELETE_PPR_REQUEST_SUCCESS = 'DELETE_PPR_REQUEST_SUCCESS' as const;
export const DELETE_PPR_REQUEST_FAILURE = 'DELETE_PPR_REQUEST_FAILURE' as const;
export const SELECT_PPR_REQUEST = 'SELECT_PPR_REQUEST' as const;
export const PPR_LOAD_FAILED = 'PPR_LOAD_FAILED' as const;
export const RESET_PPR_FORM = 'RESET_PPR_FORM' as const;
export const CONFIRM_PPR_SUBMIT_SUCCESS = 'CONFIRM_PPR_SUBMIT_SUCCESS' as const;

export type PprAction =
  | { type: typeof LOAD_PPR_REQUESTS }
  | { type: typeof SET_PPR_LOADING }
  | { type: typeof PPR_REQUESTS_LOADED; payload: { data: unknown[] } }
  | { type: typeof SUBMIT_PPR_REQUEST; payload: { values: unknown } }
  | { type: typeof SUBMIT_PPR_REQUEST_SUCCESS }
  | { type: typeof SUBMIT_PPR_REQUEST_FAILURE }
  | { type: typeof REVIEW_PPR_REQUEST; payload: { key: string; status: string; remarks?: string } }
  | { type: typeof REVIEW_PPR_REQUEST_SUCCESS }
  | { type: typeof REVIEW_PPR_REQUEST_FAILURE }
  | { type: typeof DELETE_PPR_REQUEST; payload: { key: string } }
  | { type: typeof DELETE_PPR_REQUEST_SUCCESS; payload: { key: string } }
  | { type: typeof DELETE_PPR_REQUEST_FAILURE }
  | { type: typeof SELECT_PPR_REQUEST; payload: { key: string | null } }
  | { type: typeof PPR_LOAD_FAILED }
  | { type: typeof RESET_PPR_FORM }
  | { type: typeof CONFIRM_PPR_SUBMIT_SUCCESS };

export function loadPprRequests() {
  return { type: LOAD_PPR_REQUESTS };
}

export function setPprLoading() {
  return { type: SET_PPR_LOADING };
}

export function pprRequestsLoaded(data: unknown[]) {
  return { type: PPR_REQUESTS_LOADED, payload: { data } };
}

export function submitPprRequest(values: unknown) {
  return { type: SUBMIT_PPR_REQUEST, payload: { values } };
}

export function submitPprRequestSuccess() {
  return { type: SUBMIT_PPR_REQUEST_SUCCESS };
}

export function submitPprRequestFailure() {
  return { type: SUBMIT_PPR_REQUEST_FAILURE };
}

export function reviewPprRequest(key: string, status: string, remarks?: string) {
  return { type: REVIEW_PPR_REQUEST, payload: { key, status, remarks } };
}

export function reviewPprRequestSuccess() {
  return { type: REVIEW_PPR_REQUEST_SUCCESS };
}

export function reviewPprRequestFailure() {
  return { type: REVIEW_PPR_REQUEST_FAILURE };
}

export function deletePprRequest(key: string) {
  return { type: DELETE_PPR_REQUEST, payload: { key } };
}

export function deletePprRequestSuccess(key: string) {
  return { type: DELETE_PPR_REQUEST_SUCCESS, payload: { key } };
}

export function deletePprRequestFailure() {
  return { type: DELETE_PPR_REQUEST_FAILURE };
}

export function selectPprRequest(key: string | null) {
  return { type: SELECT_PPR_REQUEST, payload: { key } };
}

export function pprLoadFailed() {
  return { type: PPR_LOAD_FAILED };
}

export function resetPprForm() {
  return { type: RESET_PPR_FORM };
}

export function confirmPprSubmitSuccess() {
  return { type: CONFIRM_PPR_SUBMIT_SUCCESS };
}
