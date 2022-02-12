import formatMoney from './formatMoney';

export const AircraftOrigin = Object.freeze({
  CLUB: 'club',
  HOME_BASE: 'homeBase',
  OTHER: 'other'
});

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

  return mtowRange.fee;
}

export const getLandingFee = (mtow, flightType, aircraftOrigin) =>
  getFee(__LANDING_FEES__, mtow, flightType, aircraftOrigin)

export const getGoAroundFee = (mtow, flightType, aircraftOrigin) =>
  getFee(__GO_AROUND_FEES__, mtow, flightType, aircraftOrigin)

const updateFeeFn = (feeGetter, feeSingleField, feeTotalField) =>
  (changeAction, mtow, flightType, aircraftOrigin, count) => {
    if (mtow && flightType && aircraftOrigin) {
      const feeSingle = feeGetter(mtow, flightType, aircraftOrigin);

      if (typeof feeSingle === 'number') {
        changeAction(feeSingleField, feeSingle);

        if (typeof count === 'number') {
          const landingFeeTotal = feeSingle * count;
          changeAction(feeTotalField, landingFeeTotal);
        }
      }
    }
  }

export const updateLandingFees = (changeAction, mtow, flightType, aircraftOrigin, landingCount) => {
  updateFeeFn(getLandingFee, 'landingFeeSingle', 'landingFeeTotal')(
    changeAction, mtow, flightType, aircraftOrigin, landingCount
  );
}

export const updateGoAroundFees = (changeAction, mtow, flightType, aircraftOrigin, goAroundCount) => {
  updateFeeFn(getGoAroundFee, 'goAroundFeeSingle', 'goAroundFeeTotal')(
    changeAction, mtow, flightType, aircraftOrigin, goAroundCount
  );
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

export const getLandingFeeText = (
  landings,
  landingFeeSingle,
  landingFeeTotal,
  goArounds,
  goAroundFeeSingle,
  goAroundFeeTotal
) => {
  if (landingFeeTotal === undefined) {
    return null;
  }

  if (goArounds > 0 && goAroundFeeTotal !== undefined) {
    const total = formatMoney(landingFeeTotal + goAroundFeeTotal);
    const landingFee = formatMoney(landingFeeSingle);
    const goAroundFee = formatMoney(goAroundFeeSingle);
    return `CHF ${total} (${landings} Landung(en) à CHF ${landingFee} und ${goArounds} Durchstart(s) à CHF ${goAroundFee})`;
  }

  const total = formatMoney(landingFeeTotal);
  if (landings > 1) {
    const landingFee = formatMoney(landingFeeSingle);
    return `CHF ${total} (${landings} Landung(en) à CHF ${landingFee})`;
  }
  return `CHF ${total}`;
}
