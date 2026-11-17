import type { PprManualAnswers } from '../../modules/ppr/actions';

// The largest MTOW limit, as on the server (functions/ppr/domain/pprSettings.js)
export const MAX_MANUAL_MTOW = 1000000;

export const NO_MANUAL_ANSWERS: PprManualAnswers = { helicopters: false, mtowFrom: null };

// Whether some requests wait for an admin: all of them with manual answers,
// those for the aircraft of the manual answers with automatic ones
export const leavesRequestsToAdmins = (answerMode: string, manualAnswers: PprManualAnswers = NO_MANUAL_ANSWERS) =>
  answerMode !== 'automatic' || manualAnswers.helicopters || manualAnswers.mtowFrom !== null;

// A whole number of kg from 1 to the largest limit, as typed, or null
export const parseMtowLimit = (value?: string | null) => {
  const text = (value || '').trim();
  if (!/^\d+$/.test(text)) {
    return null;
  }
  const mtow = Number(text);
  return mtow >= 1 && mtow <= MAX_MANUAL_MTOW ? mtow : null;
};
