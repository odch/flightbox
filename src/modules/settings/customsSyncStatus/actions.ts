export const CUSTOMS_SYNC_STATUS_LOADED = 'CUSTOMS_SYNC_STATUS_LOADED' as const;

// Written by the Cloud Functions that push data to the customs declaration
// app (see functions/customs/syncToCustoms.js), one entry per pushed list.
export type CustomsSyncStatusKey = 'selfDeclarationEmails' | 'invoiceRecipients';

export interface CustomsSyncStatus {
  status: 'ok' | 'error';
  timestamp: string;
  rejected?: string[];
  httpStatus?: number;
}

export type CustomsSyncStatusAction =
  | { type: typeof CUSTOMS_SYNC_STATUS_LOADED; payload: { statuses: unknown } };

export function customsSyncStatusLoaded(statuses: unknown) {
  return {
    type: CUSTOMS_SYNC_STATUS_LOADED,
    payload: {
      statuses,
    },
  };
}
