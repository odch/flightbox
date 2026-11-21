'use strict';

// Server-side port of src/util/landingFeeStrategies/lszm.ts (Mollis). The
// client keeps its copy for live display in the wizard; this is the
// authoritative version. Parity with the client over a grid of inputs:
// src/util/landingFeeStrategies/lszm.parity.spec.js.
const data = require('./lszm_data.json');
const { getMtowFee } = require('./utils');
const { isHelicopter } = require('../../aircraftCategories');
const { flightTypeAircraftType } = require('../../reports/airstat/tables');

// AircraftOrigin values (see functions/fees/index.js / src landingFees.ts).
const CLUB = 'club';
const HOME_BASE = 'homeBase';
const GLIDER_FLIGHT_TYPE = /^glider_(instruction|private)_(self|winch|aerotow)$/;

const isHomebaseOrigin = (aircraftOrigin) => aircraftOrigin === HOME_BASE || aircraftOrigin === CLUB;

const getFactorName = (isHomebase, isHeli, isInstruction) => {
  if (!isHomebase) {
    return 'non_homebase_plane_helicopter';
  }
  if (isHeli) {
    return 'homebase_helicopter';
  }
  if (isInstruction) {
    return 'homebase_plane_instruction';
  }
  return 'homebase_plane';
};

const gliderMatch = (flightType) => {
  const match = GLIDER_FLIGHT_TYPE.exec(flightType);
  if (!match) {
    throw new Error('Unsupported flight type ' + flightType);
  }
  return { isInstruction: match[1] === 'instruction', method: match[2] };
};

const getGliderFee = (flightType, isHomebase) => {
  const { isInstruction, method } = gliderMatch(flightType);
  let factorName = `${isHomebase ? 'homebase' : 'non_homebase'}_${method}`;
  if (isHomebase && isInstruction) {
    factorName += '_instruction';
  }
  const fee = data.fees.glider[factorName];
  return typeof fee === 'number' ? { fee } : undefined;
};

const getLandingFee = (mtow, flightType, aircraftOrigin, aircraftCategory) => {
  const isHomebase = isHomebaseOrigin(aircraftOrigin);
  if (flightTypeAircraftType(aircraftCategory) === 'glider') {
    return getGliderFee(flightType, isHomebase);
  }
  const factorName = getFactorName(isHomebase, isHelicopter(aircraftCategory), flightType === 'instruction');
  return { fee: getMtowFee(data.fees[factorName], mtow) };
};

const getGoAroundFee = () => undefined;

const getVat = (isHomebase, isHeli, isInstruction) => data.vat[getFactorName(isHomebase, isHeli, isInstruction)];

const getVatRate = (flightType, aircraftOrigin, aircraftCategory) => {
  const isHomebase = isHomebaseOrigin(aircraftOrigin);
  if (flightTypeAircraftType(aircraftCategory) === 'glider') {
    const { isInstruction, method } = gliderMatch(flightType);
    // Same factor as home base (non-instruction) for others with a winch.
    return method === 'winch' && !isHomebase ? getVat(true, false, false) : getVat(isHomebase, false, isInstruction);
  }
  return getVat(isHomebase, isHelicopter(aircraftCategory), flightType === 'instruction');
};

module.exports = { getLandingFee, getGoAroundFee, getVatRate };
