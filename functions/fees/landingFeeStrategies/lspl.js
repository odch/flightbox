'use strict';

// Server-side port of src/util/landingFeeStrategies/lspl.ts. The client keeps
// its copy for live display in the wizard; this is the authoritative version.
// Parity between the two is enforced by fees.spec.js (mirrors lspl.spec.ts).
const data = require('./lspl_data.json');
const { getMtowFee } = require('./utils');

// AircraftOrigin values (see functions/fees/index.js / src landingFees.ts).
const CLUB = 'club';
const HOME_BASE = 'homeBase';

const BALLOON_CATEGORIES = ['Ballon (Heissluft)', 'Ballon (Gas)', 'Luftschiff (Heissluft)'];
const GLIDER_AEROTOW_RE = /^glider_(instruction|private)_aerotow$/;

const isBalloon = (aircraftCategory) => BALLOON_CATEGORIES.includes(aircraftCategory);
const isAerotowTug = (flightType) => flightType === 'aerotow';
const isAerotowedGlider = (flightType) => GLIDER_AEROTOW_RE.test(flightType);
const isHomebaseOrigin = (aircraftOrigin) => aircraftOrigin === HOME_BASE || aircraftOrigin === CLUB;

const getFee = (mtow, flightType, aircraftOrigin, aircraftCategory) => {
  if (isBalloon(aircraftCategory)) {
    return data.fees.balloon;
  }
  if (isAerotowTug(flightType)) {
    return data.fees.aerotow;
  }
  if (isAerotowedGlider(flightType)) {
    return undefined;
  }
  if (isHomebaseOrigin(aircraftOrigin)) {
    return data.fees.plane_homebase;
  }
  return getMtowFee(data.fees.plane, mtow);
};

const getLandingFee = (mtow, flightType, aircraftOrigin, aircraftCategory) => {
  const fee = getFee(mtow, flightType, aircraftOrigin, aircraftCategory);
  return typeof fee === 'number' ? { fee } : undefined;
};

const getGoAroundFee = () => undefined;

const getVatRate = (flightType, aircraftOrigin, aircraftCategory) => {
  if (isBalloon(aircraftCategory)) {
    return 8.1;
  }
  if (isAerotowTug(flightType) || isAerotowedGlider(flightType)) {
    return 0;
  }
  if (isHomebaseOrigin(aircraftOrigin)) {
    return 0;
  }
  return 8.1;
};

module.exports = { getLandingFee, getGoAroundFee, getVatRate };
