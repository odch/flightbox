'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');

const config = functions.config()

const dbUrl = config.rtdb.url
const dbInstance = config.rtdb.instance;

admin.initializeApp({
  databaseURL: dbUrl || `https://${dbInstance}.firebaseio.com`
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
const api = require('./api');
const webhook = require('./webhook');
const associatedMovementsTriggers = require('./associatedMovements/setAssociatedMovementsTriggers');
const invoiceRecipientsTrigger = require('./invoiceRecipients/invoiceRecipientsTrigger');
const updateArrivalPaymentStatus = require('./updateArrivalPaymentStatus');
const { scheduledAnonymizeMovements } = require('./anonymizeMovements');
const { scheduledCleanupMessages } = require('./cleanupMessages');

exports.auth = auth;
exports.generateSignInLink = generateSignInLink;
exports.generateSignInCode = generateSignInCode;
exports.verifySignInCode = verifySignInCode;
exports.cleanupExpiredSignInCodes = cleanupExpiredSignInCodes;
exports.createTestEmailToken = createTestEmailToken;
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

exports.enrichDepartureOnCreate = enrichMovements.enrichDepartureOnCreate;
exports.enrichDepartureOnUpdate = enrichMovements.enrichDepartureOnUpdate;
exports.enrichArrivalOnCreate = enrichMovements.enrichArrivalOnCreate;
exports.enrichArrivalOnUpdate = enrichMovements.enrichArrivalOnUpdate;

exports.updateArrivalPaymentStatusOnCardPaymentUpdate = updateArrivalPaymentStatus.updateArrivalPaymentStatusOnCardPaymentUpdate;

exports.scheduledAnonymizeMovements = scheduledAnonymizeMovements;
exports.scheduledCleanupMessages = scheduledCleanupMessages;
