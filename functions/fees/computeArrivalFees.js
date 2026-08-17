'use strict';

const { onValueWritten } = require('firebase-functions/v2/database');
const { logger } = require('firebase-functions/v2');
const { defineString } = require('firebase-functions/params');
const admin = require('firebase-admin');
const { computeFees, getAircraftOrigin } = require('./index');

const RTDB_INSTANCE = defineString('RTDB_INSTANCE');
const RTDB_REGION = defineString('RTDB_REGION', { default: 'europe-west1' });

const instanceOpt = `{{ params.${RTDB_INSTANCE.name} }}`;
const regionOpt = `{{ params.${RTDB_REGION.name} }}`;

// Fee fields the server owns. On every recompute they are set to the computed
// value or cleared (null) so a stale field can never linger.
const FEE_FIELDS = [
  'landingFeeSingle', 'landingFeeCode', 'landingFeeTotal',
  'goAroundFeeSingle', 'goAroundFeeCode', 'goAroundFeeTotal',
  'feeTotalNet', 'feeVat', 'feeRoundingDifference', 'feeTotalGross',
];

// Aircraft registry keys are stored without a dash and upper-cased (see
// updateAircraftList), so normalize before the registry lookup — a cosmetic
// variant must not dodge the registry override.
const normalizeRegistration = (immatriculation) =>
  String(immatriculation || '').replace(/[-\s]/g, '').toUpperCase();

/**
 * Recompute the authoritative fee for an arrival and write it back.
 *
 * Gated per project by `/settings/landingFeesStrategy`: absent → no-op (the
 * project is not on server-owned fees, e.g. every currently-live project during
 * the lspl pilot). Only strategies ported into functions/fees are honoured; an
 * unrecognised strategy fails closed (logs, writes nothing).
 */
async function recomputeArrivalFees(event) {
  const after = event.data.after;
  if (!after.exists()) {
    return; // deleted
  }
  const arrival = after.val();
  if (arrival.anonymized) {
    return; // PII stripped by retention job; nothing to price
  }

  const db = admin.database();

  const strategy = (await db.ref('/settings/landingFeesStrategy').once('value')).val();
  if (!strategy) {
    return; // project not on server-owned fees
  }

  // MTOW / category: authoritative from the registry when the registration is
  // known; otherwise the pilot-submitted values, flagged for admin review. The
  // record's own mtow/aircraftCategory are left untouched (never silently
  // rewrite a pilot's declaration); only the computed fee + source flag are set.
  const reg = normalizeRegistration(arrival.immatriculation);
  let mtow = arrival.mtow;
  let aircraftCategory = arrival.aircraftCategory;
  let aircraftDataSource = 'manual';
  if (reg) {
    const registryEntry = (await db.ref('/aircrafts').child(reg).once('value')).val();
    if (registryEntry) {
      if (typeof registryEntry.mtow === 'number') {
        mtow = registryEntry.mtow;
      }
      if (registryEntry.category) {
        aircraftCategory = registryEntry.category;
      }
      aircraftDataSource = 'registry';
    }
  }

  const [club, homeBase] = await Promise.all([
    db.ref('/settings/aircrafts/club').once('value').then(s => s.val() || {}),
    db.ref('/settings/aircrafts/homeBase').once('value').then(s => s.val() || {}),
  ]);
  const aircraftOrigin = getAircraftOrigin(arrival.immatriculation, { club, homeBase });

  let fees;
  try {
    fees = computeFees({
      strategy,
      mtow,
      flightType: arrival.flightType,
      aircraftOrigin,
      aircraftCategory,
      landingCount: arrival.landingCount || 0,
      goAroundCount: arrival.goAroundCount || 0,
    });
  } catch (e) {
    logger.error(`Fee computation failed for arrival ${after.ref.key}:`, e);
    return; // fail closed — never write a guessed fee
  }

  const update = { aircraftDataSource };
  FEE_FIELDS.forEach(field => {
    update[field] = Object.prototype.hasOwnProperty.call(fees, field) ? fees[field] : null;
  });

  // Loop guard: onValueWritten fires again on our own write, so only write when
  // something actually changed.
  const changed = Object.keys(update).some(key => (arrival[key] === undefined ? null : arrival[key]) !== update[key]);
  if (!changed) {
    return;
  }

  await after.ref.update(update);
  logger.info(`Recomputed fees for arrival ${after.ref.key} (source: ${aircraftDataSource}, gross: ${update.feeTotalGross})`);
}

exports.computeArrivalFeesOnWrite = onValueWritten(
  { region: regionOpt, instance: instanceOpt, ref: '/arrivals/{arrivalId}' },
  recomputeArrivalFees
);

exports._test = { recomputeArrivalFees, normalizeRegistration, FEE_FIELDS };
