export const AircraftOrigin = Object.freeze({
  CLUB: 'club',
  HOME_BASE: 'homeBase',
  OTHER: 'other'
});

export const getLandingFee = (mtow, flightType, aircraftOrigin) => {
  if (typeof __LANDING_FEES__ === 'undefined') {
    return undefined;
  }

  const feesForType = __LANDING_FEES__[flightType] || __LANDING_FEES__['default'];

  if (!feesForType) {
    throw new Error(`No landing fees defined for flight type '${flightType}'`);
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
    throw new Error(`No landing fees defined for MTOW ${mtow} and flight type '${flightType}'`);
  }

  return mtowRange.fee;
}

export const updateMovementFees = (changeAction, mtow, flightType, aircraftOrigin, landingCount) => {
  if (mtow && flightType && aircraftOrigin) {
    const landingFeeSingle = getLandingFee(mtow, flightType, aircraftOrigin);

    if (typeof landingFeeSingle === 'number') {
      changeAction('landingFeeSingle', landingFeeSingle);

      if (typeof landingCount === 'number') {
        const landingFeeTotal = landingFeeSingle * landingCount
        changeAction('landingFeeTotal', landingFeeTotal);
      }
    }
  }
}

export const getAircraftOrigin = (immatriculation, {club, homeBase}) => {
  if (!immatriculation) {
    return undefined;
  }
  if (club[immatriculation] === true) {
    return AircraftOrigin.CLUB;
  }
  if (homeBase[immatriculation] === true) {
    return AircraftOrigin.HOME_BASE;
  }
  return AircraftOrigin.OTHER;
}
