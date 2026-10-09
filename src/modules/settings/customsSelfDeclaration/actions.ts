export const CUSTOMS_SELF_DECLARATION_EMAILS_LOADED = 'CUSTOMS_SELF_DECLARATION_EMAILS_LOADED' as const;
export const ADD_CUSTOMS_SELF_DECLARATION_EMAIL = 'ADD_CUSTOMS_SELF_DECLARATION_EMAIL' as const;
export const REMOVE_CUSTOMS_SELF_DECLARATION_EMAIL = 'REMOVE_CUSTOMS_SELF_DECLARATION_EMAIL' as const;
export const SAVE_CUSTOMS_SELF_DECLARATION_EMAILS_SAVING = 'SAVE_CUSTOMS_SELF_DECLARATION_EMAILS_SAVING' as const;
export const SAVE_CUSTOMS_SELF_DECLARATION_EMAILS_SUCCESS = 'SAVE_CUSTOMS_SELF_DECLARATION_EMAILS_SUCCESS' as const;
export const SAVE_CUSTOMS_SELF_DECLARATION_EMAILS_FAILURE = 'SAVE_CUSTOMS_SELF_DECLARATION_EMAILS_FAILURE' as const;

export type CustomsSelfDeclarationAction =
  | { type: typeof CUSTOMS_SELF_DECLARATION_EMAILS_LOADED; payload: { emails: unknown } }
  | { type: typeof ADD_CUSTOMS_SELF_DECLARATION_EMAIL; payload: { email: string } }
  | { type: typeof REMOVE_CUSTOMS_SELF_DECLARATION_EMAIL; payload: { email: string } }
  | { type: typeof SAVE_CUSTOMS_SELF_DECLARATION_EMAILS_SAVING }
  | { type: typeof SAVE_CUSTOMS_SELF_DECLARATION_EMAILS_SUCCESS }
  | { type: typeof SAVE_CUSTOMS_SELF_DECLARATION_EMAILS_FAILURE };

// Receives the raw database value (or null when it does not exist or the
// admin signed out); the reducer normalises it.
export function customsSelfDeclarationEmailsLoaded(emails: unknown) {
  return {
    type: CUSTOMS_SELF_DECLARATION_EMAILS_LOADED,
    payload: {
      emails,
    },
  };
}

export function addCustomsSelfDeclarationEmail(email: string) {
  return {
    type: ADD_CUSTOMS_SELF_DECLARATION_EMAIL,
    payload: {
      email,
    },
  };
}

export function removeCustomsSelfDeclarationEmail(email: string) {
  return {
    type: REMOVE_CUSTOMS_SELF_DECLARATION_EMAIL,
    payload: {
      email,
    },
  };
}

export function saveCustomsSelfDeclarationEmailsSaving() {
  return {
    type: SAVE_CUSTOMS_SELF_DECLARATION_EMAILS_SAVING,
  };
}

export function saveCustomsSelfDeclarationEmailsSuccess() {
  return {
    type: SAVE_CUSTOMS_SELF_DECLARATION_EMAILS_SUCCESS,
  };
}

export function saveCustomsSelfDeclarationEmailsFailure() {
  return {
    type: SAVE_CUSTOMS_SELF_DECLARATION_EMAILS_FAILURE,
  };
}
