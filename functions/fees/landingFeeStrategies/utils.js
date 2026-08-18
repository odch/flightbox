'use strict';

// Return the fee for the first weight band whose ceiling the MTOW falls under.
// Ported verbatim from src/util/landingFeeStrategies/utils.ts — kept in sync by
// the parity tests.
const getMtowFee = (feeList, mtow) => {
  for (const entry of feeList) {
    if (mtow <= entry.max_weight) {
      return entry.fee;
    }
  }
  return undefined;
};

module.exports = { getMtowFee };
