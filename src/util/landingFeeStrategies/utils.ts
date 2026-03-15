export const getMtowFee = (feeList: any[], mtow: number) => {
  for (const entry of feeList) {
    if (mtow <= entry.max_weight) {
      return entry.fee
    }
  }
}
