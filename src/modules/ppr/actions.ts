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
export const INIT_PPR_FORM = 'INIT_PPR_FORM' as const;
export const PPR_FORM_INITIALIZED = 'PPR_FORM_INITIALIZED' as const;
export const PPR_LOAD_FAILED = 'PPR_LOAD_FAILED' as const;
export const RESET_PPR_FORM = 'RESET_PPR_FORM' as const;
export const CONFIRM_PPR_SUBMIT_SUCCESS = 'CONFIRM_PPR_SUBMIT_SUCCESS' as const;
export const LOAD_PPR_SETTINGS = 'LOAD_PPR_SETTINGS' as const;
export const PPR_SETTINGS_LOADED = 'PPR_SETTINGS_LOADED' as const;
export const PPR_SETTINGS_LOAD_FAILED = 'PPR_SETTINGS_LOAD_FAILED' as const;
export const SAVE_PPR_SETTINGS = 'SAVE_PPR_SETTINGS' as const;
export const SAVE_PPR_SETTINGS_SUCCESS = 'SAVE_PPR_SETTINGS_SUCCESS' as const;
export const SAVE_PPR_SETTINGS_FAILURE = 'SAVE_PPR_SETTINGS_FAILURE' as const;
export const REVOKE_PPR_APPROVAL = 'REVOKE_PPR_APPROVAL' as const;
export const REVOKE_PPR_APPROVAL_SUCCESS = 'REVOKE_PPR_APPROVAL_SUCCESS' as const;
export const REVOKE_PPR_APPROVAL_FAILURE = 'REVOKE_PPR_APPROVAL_FAILURE' as const;

// Days requests are rejected for automatically, with the reason
export interface PprClosure {
  from: string;
  to: string;
  reason: string;
}

export type PprAnswerMode = 'manual' | 'automatic';

export interface PprSettings {
  adminEmail: string | null;
  retentionDays: number | null;
  answerMode: PprAnswerMode;
  pilotInfo: string | null;
  closures: PprClosure[];
}

// What the server answers to a submission: requests can be answered right away
export interface PprSubmitResult {
  key: string;
  status: string;
  reviewRemarks?: string;
}

export type PprListScope = 'own' | 'all';

export type PprAction =
  | { type: typeof LOAD_PPR_REQUESTS; payload: { scope: PprListScope } }
  | { type: typeof SET_PPR_LOADING }
  | { type: typeof PPR_REQUESTS_LOADED; payload: { data: unknown[]; scope: PprListScope } }
  | { type: typeof SUBMIT_PPR_REQUEST; payload: { values: unknown } }
  | { type: typeof SUBMIT_PPR_REQUEST_SUCCESS; payload: { result: PprSubmitResult | null } }
  | { type: typeof SUBMIT_PPR_REQUEST_FAILURE }
  | { type: typeof REVIEW_PPR_REQUEST; payload: { key: string; status: string; remarks?: string } }
  | { type: typeof REVIEW_PPR_REQUEST_SUCCESS }
  | { type: typeof REVIEW_PPR_REQUEST_FAILURE }
  | { type: typeof DELETE_PPR_REQUEST; payload: { key: string } }
  | { type: typeof DELETE_PPR_REQUEST_SUCCESS; payload: { key: string } }
  | { type: typeof DELETE_PPR_REQUEST_FAILURE }
  | { type: typeof SELECT_PPR_REQUEST; payload: { key: string | null } }
  | { type: typeof INIT_PPR_FORM }
  | { type: typeof PPR_FORM_INITIALIZED; payload: { initialValues: Record<string, any> } }
  | { type: typeof PPR_LOAD_FAILED }
  | { type: typeof RESET_PPR_FORM }
  | { type: typeof CONFIRM_PPR_SUBMIT_SUCCESS }
  | { type: typeof LOAD_PPR_SETTINGS }
  | { type: typeof PPR_SETTINGS_LOADED; payload: { settings: PprSettings } }
  | { type: typeof PPR_SETTINGS_LOAD_FAILED }
  | { type: typeof SAVE_PPR_SETTINGS; payload: { settings: Partial<PprSettings> } }
  | { type: typeof SAVE_PPR_SETTINGS_SUCCESS; payload: { settings: PprSettings } }
  | { type: typeof SAVE_PPR_SETTINGS_FAILURE }
  | { type: typeof REVOKE_PPR_APPROVAL; payload: { key: string; remarks: string } }
  | { type: typeof REVOKE_PPR_APPROVAL_SUCCESS }
  | { type: typeof REVOKE_PPR_APPROVAL_FAILURE };

export function loadPprRequests(scope: PprListScope = 'own') {
  return { type: LOAD_PPR_REQUESTS, payload: { scope } };
}

export function setPprLoading() {
  return { type: SET_PPR_LOADING };
}

export function pprRequestsLoaded(data: unknown[], scope: PprListScope = 'own') {
  return { type: PPR_REQUESTS_LOADED, payload: { data, scope } };
}

export function submitPprRequest(values: unknown) {
  return { type: SUBMIT_PPR_REQUEST, payload: { values } };
}

export function submitPprRequestSuccess(result: PprSubmitResult | null = null) {
  return { type: SUBMIT_PPR_REQUEST_SUCCESS, payload: { result } };
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

export function initPprForm() {
  return { type: INIT_PPR_FORM };
}

export function pprFormInitialized(initialValues: Record<string, any>) {
  return { type: PPR_FORM_INITIALIZED, payload: { initialValues } };
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

export function loadPprSettings() {
  return { type: LOAD_PPR_SETTINGS };
}

export function pprSettingsLoaded(settings: PprSettings) {
  return { type: PPR_SETTINGS_LOADED, payload: { settings } };
}

export function pprSettingsLoadFailed() {
  return { type: PPR_SETTINGS_LOAD_FAILED };
}

// Saves only the given settings
export function savePprSettings(settings: Partial<PprSettings>) {
  return { type: SAVE_PPR_SETTINGS, payload: { settings } };
}

export function savePprSettingsSuccess(settings: PprSettings) {
  return { type: SAVE_PPR_SETTINGS_SUCCESS, payload: { settings } };
}

export function savePprSettingsFailure() {
  return { type: SAVE_PPR_SETTINGS_FAILURE };
}

export function revokePprApproval(key: string, remarks: string) {
  return { type: REVOKE_PPR_APPROVAL, payload: { key, remarks } };
}

export function revokePprApprovalSuccess() {
  return { type: REVOKE_PPR_APPROVAL_SUCCESS };
}

export function revokePprApprovalFailure() {
  return { type: REVOKE_PPR_APPROVAL_FAILURE };
}
