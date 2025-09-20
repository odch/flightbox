export const roundToOneCent = val => Math.round(val * 100) / 100;

export const getMtowFee = (feeList, mtow) => {
  for (const entry of feeList) {
    if (mtow <= entry.max_weight) {
      return entry.fee
    }
  }
}
