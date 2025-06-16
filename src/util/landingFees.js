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

const getTaxRate = (flightType, aircraftOrigin, aircraftCategory) =>
  strategies[__LANDING_FEES_STRATEGY__ || 'default'].getVatRate(flightType, aircraftOrigin, aircraftCategory)

const roundToFiveCents = val => Math.round(val * 20) / 20;

const roundToOneCent = val => Math.round(val * 100) / 100;

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

          return landingFeeTotal
        }
      }
    }

    return 0
  }

export const updateLandingFees = (changeAction, mtow, flightType, aircraftOrigin, aircraftCategory, landingCount) => {
  return updateFeeFn(getLandingFee, 'landingFeeSingle', 'landingFeeTotal', 'landingFeeCode')(
    changeAction, mtow, flightType, aircraftOrigin, aircraftCategory, landingCount
  );
}

export const updateGoAroundFees = (changeAction, mtow, flightType, aircraftOrigin, aircraftCategory, goAroundCount) => {
  return updateFeeFn(getGoAroundFee, 'goAroundFeeSingle', 'goAroundFeeTotal', 'goAroundFeeCode')(
    changeAction, mtow, flightType, aircraftOrigin, aircraftCategory, goAroundCount
  );
}

const getFeesTotals = (landingFeeTotal = 0, goAroundFeeTotal = 0, flightType, aircraftOrigin, aircraftCategory) => {
  const totalNet = landingFeeTotal + goAroundFeeTotal

  const taxRate = getTaxRate(flightType, aircraftOrigin, aircraftCategory);

  const vat = roundToOneCent(totalNet * (taxRate / 100))

  const totalGross = totalNet + vat

  const totalGrossRounded = roundToFiveCents(totalGross)

  const roundingDifference = roundToOneCent(totalGrossRounded - totalGross)

  return {
    totalNet,
    vat,
    roundingDifference,
    totalGrossRounded
  }
}

export const updateFeesTotal = (changeAction, landingFeeTotal, goAroundFeeTotal, flightType, aircraftOrigin, aircraftCategory) => {
  const {totalNet, vat, roundingDifference, totalGrossRounded} =
    getFeesTotals(landingFeeTotal, goAroundFeeTotal, flightType, aircraftOrigin, aircraftCategory)

  changeAction('feeTotalNet', totalNet);
  changeAction('feeVat', vat);
  changeAction('feeRoundingDifference', roundingDifference);
  changeAction('feeTotalGross', totalGrossRounded);
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
