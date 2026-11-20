'use strict';

// Server-side port of src/util/landingFeeStrategies/lsze.ts. The client keeps
// its copy for live display in the wizard; this is the authoritative version.
// Parity between the two is enforced by fees.spec.js (mirrors lsze.spec.ts).
// CAUTION: the fees in lsze_data.json are INCLUDING VAT.
const data = require('./lsze_data.json');
const { getMtowFee } = require('./utils');

const VAT_RATE = 8.1;

// Mirrors src/util/aircraftCategories.ts isHelicopter.
const HELICOPTER_CATEGORIES = ['Hubschrauber', 'Eigenbauhubschrauber'];
const isHelicopter = (aircraftCategory) => HELICOPTER_CATEGORIES.includes(aircraftCategory);

// Over 3000 kg: CHF 20 per started ton.
const getMtowFeeHeavy = (mtow) => Math.ceil(mtow / 1000) * 20;

const getFee = (mtow, flightType, aircraftOrigin, aircraftCategory) => {
  if (mtow > 3000) {
    return getMtowFeeHeavy(mtow);
  }
  return getMtowFee(isHelicopter(aircraftCategory) ? data.fees.helicopter : data.fees.plane, mtow);
};

const getVatRate = () => VAT_RATE;

const getLandingFee = (mtow, flightType, aircraftOrigin, aircraftCategory) => {
  const fee = getFee(mtow, flightType, aircraftOrigin, aircraftCategory);
  if (fee) {
    const netFee = fee / (1 + getVatRate(flightType, aircraftOrigin, aircraftCategory) / 100);
    return { fee: Math.round(netFee * 100) / 100 };
  }
  return undefined;
};

const getGoAroundFee = () => undefined;

module.exports = { getLandingFee, getGoAroundFee, getVatRate };
