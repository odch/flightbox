'use strict';

const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');

const config = process.env.K_CONFIGURATION ? {} : functions.config();
const { rtdb = {} } = config;
const dbUrl = rtdb.url || process.env.RTDB_URL;
const dbInstance = rtdb.instance || process.env.RTDB_INSTANCE;

admin.initializeApp({
  databaseURL: dbUrl || (dbInstance ? `https://${dbInstance}.firebaseio.com` : undefined),
});

const { scheduledAerodromesUpdate } = require('./updateAerodromes');
const { scheduledAircraftListUpdate } = require('./updateAircraftList');
const enrichMovements = require('./enrichMovements');

const auth = require('./auth');
const { generateSignInLink } = require('./auth/generateSignInLink');
const { generateSignInCode } = require('./auth/generateSignInCode');
const { verifySignInCode } = require('./auth/verifySignInCode');
const { cleanupExpiredSignInCodes } = require('./auth/cleanupExpiredSignInCodes');
const { createTestEmailToken } = require('./auth/createTestEmailToken');
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
const { scheduledAnonymizeMovements } = require('./anonymizeMovements');
const { scheduledCleanupMessages } = require('./cleanupMessages');

exports.auth = auth;
exports.generateSignInLink = generateSignInLink;
exports.generateSignInCode = generateSignInCode;
exports.verifySignInCode = verifySignInCode;
exports.cleanupExpiredSignInCodes = cleanupExpiredSignInCodes;
exports.createTestEmailToken = createTestEmailToken;
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

exports.scheduledAnonymizeMovements = scheduledAnonymizeMovements;
exports.scheduledCleanupMessages = scheduledCleanupMessages;
