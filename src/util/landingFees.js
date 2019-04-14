
export const getLandingFee = (mtow, flightType) => {
  if (typeof __LANDING_FEES__ === 'undefined') {
    return undefined
  }

  const feesForType = __LANDING_FEES__[flightType] || __LANDING_FEES__['default']

  if (!feesForType) {
    throw new Error(`No landing fees defined for flight type '${flightType}'`)
  }

  const mtowRange = feesForType.find(mtowRange => {
    if (typeof mtowRange.mtowMin !== 'undefined' && mtowRange.mtowMin > mtow) {
      return false
    }
    if (typeof mtowRange.mtowMax !== 'undefined' && mtowRange.mtowMax < mtow) {
      return false
    }
    return true
  })

  if (!mtowRange) {
    throw new Error(`No landing fees defined for MTOW ${mtow} and flight type '${flightType}'`)
  }

  return mtowRange.fee
}

export const updateMovementFees = (changeAction, mtow, flightType, landingCount) => {
  if (mtow && flightType) {
    const landingFeeSingle = getLandingFee(mtow, flightType)

    if (typeof landingFeeSingle === 'number') {
      changeAction('landingFeeSingle', landingFeeSingle);

      if (typeof landingCount === 'number') {
        const landingFeeTotal = landingFeeSingle * landingCount
        changeAction('landingFeeTotal', landingFeeTotal);
      }
    }
  }
}
