'use strict';

// Authoritative, server-side fee computation. Mirrors src/util/landingFees.ts
// (orchestration + rounding) and the per-project strategies. Parity with the
// client is enforced by fees.spec.js. Only strategies ported here can be used
// server-side; a project whose strategy is not present must not be switched to
// server-owned fees.
const lspl = require('./landingFeeStrategies/lspl');

const AircraftOrigin = Object.freeze({
  CLUB: 'club',
  HOME_BASE: 'homeBase',
  OTHER: 'other',
});

const strategies = {
  lspl,
};

const roundToFiveCents = (val) => Math.round(val * 20) / 20;
const roundToOneCent = (val) => Math.round(val * 100) / 100;

const getStrategy = (name) => strategies[name];

// Mirrors src getAircraftOrigin: club/home-base from settings, otherwise OTHER.
// An unknown/absent registration yields OTHER (no discount), so a faked
// registration can only ever cost more.
const getAircraftOrigin = (immatriculation, aircraftSettings) => {
  if (!immatriculation) {
    return undefined;
  }
  const settings = aircraftSettings || {};
  const club = settings.club || {};
  const homeBase = settings.homeBase || {};
  if (club[immatriculation] === true) {
    return AircraftOrigin.CLUB;
  }
  if (homeBase[immatriculation] === true) {
    return AircraftOrigin.HOME_BASE;
  }
  return AircraftOrigin.OTHER;
};

/**
 * Compute the full set of fee fields for a movement. Returns the same field
 * shape the client writes today (landingFee*, goAroundFee*, feeTotal*), or an
 * empty object when the fee-determining inputs are incomplete.
 *
 * @throws if the named strategy is not available server-side.
 */
const computeFees = ({
  strategy,
  mtow,
  flightType,
  aircraftOrigin,
  aircraftCategory,
  landingCount = 0,
  goAroundCount = 0,
}) => {
  const strat = getStrategy(strategy);
  if (!strat) {
    throw new Error(`Unknown landing-fee strategy '${strategy}'`);
  }

  // Match the client: no fee unless every fee-determining input is present.
  if (!mtow || !flightType || !aircraftOrigin || !aircraftCategory) {
    return {};
  }

  const result = {};
  let landingFeeTotal = 0;
  let goAroundFeeTotal = 0;

  const landing = strat.getLandingFee(mtow, flightType, aircraftOrigin, aircraftCategory);
  if (landing) {
    result.landingFeeSingle = landing.fee;
    if (landing.billingProduct !== undefined) {
      result.landingFeeCode = landing.billingProduct;
    }
    landingFeeTotal = landing.fee * landingCount;
    result.landingFeeTotal = landingFeeTotal;
  }

  const goAround = strat.getGoAroundFee(mtow, flightType, aircraftOrigin, aircraftCategory);
  if (goAround) {
    result.goAroundFeeSingle = goAround.fee;
    if (goAround.billingProduct !== undefined) {
      result.goAroundFeeCode = goAround.billingProduct;
    }
    goAroundFeeTotal = goAround.fee * goAroundCount;
    result.goAroundFeeTotal = goAroundFeeTotal;
  }

  const totalNet = landingFeeTotal + goAroundFeeTotal;
  const taxRate = strat.getVatRate(flightType, aircraftOrigin, aircraftCategory);
  const vat = roundToOneCent(totalNet * (taxRate / 100));
  const totalGross = totalNet + vat;
  const totalGrossRounded = roundToFiveCents(totalGross);
  const roundingDifference = roundToOneCent(totalGrossRounded - totalGross);

  result.feeTotalNet = totalNet;
  result.feeVat = vat;
  result.feeRoundingDifference = roundingDifference;
  result.feeTotalGross = totalGrossRounded;

  return result;
};

module.exports = {
  AircraftOrigin,
  strategies,
  getStrategy,
  getAircraftOrigin,
  computeFees,
  roundToFiveCents,
  roundToOneCent,
};
