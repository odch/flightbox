'use strict';

const admin = require('firebase-admin');

const dbUrl = process.env.RTDB_URL;
const dbInstance = process.env.RTDB_INSTANCE;

admin.initializeApp({
  databaseURL: dbUrl || (dbInstance ? `https://${dbInstance}.firebaseio.com` : undefined),
});

const { scheduledAerodromesUpdate } = require('./updateAerodromes');
const { scheduledAircraftListUpdate } = require('./updateAircraftList');
const enrichMovements = require('./enrichMovements');

const auth = require('./auth');
const { generateSignInCode } = require('./auth/generateSignInCode');
const { verifySignInCode } = require('./auth/verifySignInCode');
const { cleanupExpiredSignInCodes } = require('./auth/cleanupExpiredSignInCodes');
const { generateWebauthnRegistrationOptions } = require('./auth/generateRegistrationOptions');
const { verifyWebauthnRegistration } = require('./auth/verifyRegistration');
const { generateWebauthnAuthenticationOptions } = require('./auth/generateAuthenticationOptions');
const { verifyWebauthnAuthentication } = require('./auth/verifyAuthentication');
const { removeWebauthnCredential } = require('./auth/removePasskey');
const { cleanupExpiredWebauthnChallenges } = require('./auth/cleanupExpiredWebauthnChallenges');
const api = require('./api');
const webhook = require('./webhook');
const associatedMovementsTriggers = require('./associatedMovements/setAssociatedMovementsTriggers');
const invoiceRecipientsTrigger = require('./invoiceRecipients/invoiceRecipientsTrigger');
const homebasedAircraftTrigger = require('./homebasedAircraft/homebasedAircraftTrigger');
const updateArrivalPaymentStatus = require('./updateArrivalPaymentStatus');

exports.auth = auth;
exports.generateSignInCode = generateSignInCode;
exports.verifySignInCode = verifySignInCode;
exports.cleanupExpiredSignInCodes = cleanupExpiredSignInCodes;
exports.generateWebauthnRegistrationOptions = generateWebauthnRegistrationOptions;
exports.verifyWebauthnRegistration = verifyWebauthnRegistration;
exports.generateWebauthnAuthenticationOptions = generateWebauthnAuthenticationOptions;
exports.verifyWebauthnAuthentication = verifyWebauthnAuthentication;
exports.removeWebauthnCredential = removeWebauthnCredential;
exports.cleanupExpiredWebauthnChallenges = cleanupExpiredWebauthnChallenges;
exports.api = api;
exports.webhook = webhook;
exports.setAssociatedMovementOnCreatedDeparture = associatedMovementsTriggers.setAssociatedMovementOnCreatedDeparture;
exports.setAssociatedMovementOnCreatedArrival = associatedMovementsTriggers.setAssociatedMovementOnCreatedArrival;
exports.setAssociatedMovementOnUpdatedDeparture = associatedMovementsTriggers.setAssociatedMovementOnUpdatedDeparture;
exports.setAssociatedMovementOnUpdatedArrival = associatedMovementsTriggers.setAssociatedMovementOnUpdatedArrival;

exports.scheduledAerodromesUpdate = scheduledAerodromesUpdate;
exports.scheduledAircraftListUpdate = scheduledAircraftListUpdate;
exports.setAssociatedMovementOnDeletedDeparture = associatedMovementsTriggers.setAssociatedMovementOnDeletedDeparture;
exports.setAssociatedMovementOnDeletedArrival = associatedMovementsTriggers.setAssociatedMovementOnDeletedArrival;
exports.updateCustomsInvoiceRecipientsOnUpdate = invoiceRecipientsTrigger.updateCustomsInvoiceRecipientsOnUpdate;
exports.updateCustomsHomebasedAircraftOnUpdate = homebasedAircraftTrigger.updateCustomsHomebasedAircraftOnUpdate;

exports.enrichDepartureOnCreate = enrichMovements.enrichDepartureOnCreate;
exports.enrichDepartureOnUpdate = enrichMovements.enrichDepartureOnUpdate;
exports.enrichArrivalOnCreate = enrichMovements.enrichArrivalOnCreate;
exports.enrichArrivalOnUpdate = enrichMovements.enrichArrivalOnUpdate;

exports.updateArrivalPaymentStatusOnCardPaymentUpdate = updateArrivalPaymentStatus.updateArrivalPaymentStatusOnCardPaymentUpdate;

let privacyFunctionsEnabled = false;
try {
  privacyFunctionsEnabled = require('./privacy-config.generated.js');
} catch (e) {
  // Generated file is written by the deploy workflow; absent in local
  // dev and unit tests, where the retention jobs should stay disabled.
  if (e.code !== 'MODULE_NOT_FOUND') throw e;
}

if (privacyFunctionsEnabled) {
  const { scheduledAnonymizeMovements } = require('./anonymizeMovements');
  const { scheduledCleanupMessages } = require('./cleanupMessages');
  exports.scheduledAnonymizeMovements = scheduledAnonymizeMovements;
  exports.scheduledCleanupMessages = scheduledCleanupMessages;
}

// The test email-token endpoint mints a custom token for a fixed test
// user, so it must only ever be deployed to the cypress-testing project.
// The generated flag is read at module load (during deploy source
// analysis), unlike process.env which is applied only at runtime; see
// functions/package.json `deploy:cypress`.
let testFunctionsEnabled = false;
try {
  testFunctionsEnabled = require('./test-config.generated.js');
} catch (e) {
  if (e.code !== 'MODULE_NOT_FOUND') throw e;
}

if (testFunctionsEnabled) {
  const { createTestEmailToken } = require('./auth/createTestEmailToken');
  exports.createTestEmailToken = createTestEmailToken;
}
