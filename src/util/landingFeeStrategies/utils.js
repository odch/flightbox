export const getMtowFee = (feeList, mtow) => {
  for (const entry of feeList) {
    if (mtow <= entry.max_weight) {
      return entry.fee
    }
  }
}
