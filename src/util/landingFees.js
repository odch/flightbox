import formatMoney from './formatMoney';
import defaultGetFee from './landingFeeStrategies/default'
import lszmGetFee from './landingFeeStrategies/lszm'

export const AircraftOrigin = Object.freeze({
  CLUB: 'club',
  HOME_BASE: 'homeBase',
  OTHER: 'other'
});

const strategies = {
  default: defaultGetFee,
  lszm: lszmGetFee
}

export const getLandingFee = (mtow, flightType, aircraftOrigin, aircraftCategory) =>
  strategies[__LANDING_FEES_STRATEGY__ || 'default'].getLandingFee(mtow, flightType, aircraftOrigin, aircraftCategory)

export const getGoAroundFee = (mtow, flightType, aircraftOrigin, aircraftCategory) =>
  strategies[__LANDING_FEES_STRATEGY__ || 'default'].getGoAroundFee(mtow, flightType, aircraftOrigin, aircraftCategory)

const updateFeeFn = (feeGetter, feeSingleField, feeTotalField, feeCodeField) =>
  (changeAction, mtow, flightType, aircraftOrigin, aircraftCategory, count) => {
    if (mtow && flightType && aircraftOrigin && aircraftCategory) {
      const feeSingle = feeGetter(mtow, flightType, aircraftOrigin, aircraftCategory);

      if (feeSingle) {
        changeAction(feeSingleField, feeSingle.fee);
        changeAction(feeCodeField, feeSingle.billingProduct);

        if (typeof count === 'number') {
          const landingFeeTotal = feeSingle.fee * count;
          changeAction(feeTotalField, landingFeeTotal);
        }
      }
    }
  }

export const updateLandingFees = (changeAction, mtow, flightType, aircraftOrigin, aircraftCategory, landingCount) => {
  updateFeeFn(getLandingFee, 'landingFeeSingle', 'landingFeeTotal', 'landingFeeCode')(
    changeAction, mtow, flightType, aircraftOrigin, aircraftCategory, landingCount
  );
}

export const updateGoAroundFees = (changeAction, mtow, flightType, aircraftOrigin, aircraftCategory, goAroundCount) => {
  updateFeeFn(getGoAroundFee, 'goAroundFeeSingle', 'goAroundFeeTotal', 'goAroundFeeCode')(
    changeAction, mtow, flightType, aircraftOrigin, aircraftCategory, goAroundCount
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
    return `CHF ${total} (${landings} ${landings > 1 ? 'Landungen' : 'Landung'} à CHF ${landingFee} und ${goArounds} ${goArounds > 1 ? 'Durchstarts' : 'Durchstart'} à CHF ${goAroundFee})`;
  }

  const total = formatMoney(landingFeeTotal);
  if (landings > 1) {
    const landingFee = formatMoney(landingFeeSingle);
    return `CHF ${total} (${landings} Landungen à CHF ${landingFee})`;
  }
  return `CHF ${total}`;
}
