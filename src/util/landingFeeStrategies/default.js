
const getLandingFee = (mtow, flightType, aircraftOrigin, aircraftCategory) =>
  getFee(__LANDING_FEES__, mtow, flightType, aircraftOrigin)

const getGoAroundFee = (mtow, flightType, aircraftOrigin, aircraftCategory) =>
  getFee(__GO_AROUND_FEES__, mtow, flightType, aircraftOrigin)

const getFee = (feesDefinition, mtow, flightType, aircraftOrigin) => {
  if (typeof feesDefinition === 'undefined') {
    return undefined;
  }

  const feesForType = feesDefinition[flightType] || feesDefinition['default'];

  if (!feesForType) {
    throw new Error(`No fees defined for flight type '${flightType}'`);
  }

  const feesForAircraftOrigin = feesForType[aircraftOrigin] || feesForType['default'];

  const mtowRange = feesForAircraftOrigin.find(mtowRange => {
    if (typeof mtowRange.mtowMin !== 'undefined' && mtowRange.mtowMin > mtow) {
      return false;
    }
    if (typeof mtowRange.mtowMax !== 'undefined' && mtowRange.mtowMax < mtow) {
      return false;
    }
    return true;
  })

  if (!mtowRange) {
    throw new Error(`No fees defined for MTOW ${mtow} and flight type '${flightType}'`);
  }

  return {fee: mtowRange.fee, billingProduct: mtowRange.billingProduct};
}

export default {
  getLandingFee,
  getGoAroundFee
}
