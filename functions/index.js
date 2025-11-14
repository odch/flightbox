'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');

const dbInstance = functions.config().rtdb.instance;

admin.initializeApp({
  databaseURL: `https://${dbInstance}.firebaseio.com`
});

const { scheduledAerodromesUpdate } = require('./updateAerodromes');
const { scheduledAircraftListUpdate } = require('./updateAircraftList');
const enrichMovements = require('./enrichMovements');

const auth = require('./auth');
const { generateSignInLink } = require('./auth/generateSignInLink');
const { sendSignInEmail } = require('./auth/sendSignInEmail');
const api = require('./api');
const webhook = require('./webhook');
const setAssociatedMovementsCronJob = require('./associatedMovements/setAssociatedMovementsCronJob');
const associatedMovementsTriggers = require('./associatedMovements/setAssociatedMovementsTriggers');
const invoiceRecipientsTrigger = require('./invoiceRecipients/invoiceRecipientsTrigger');

exports.auth = auth;
exports.generateSignInLink = generateSignInLink;
exports.sendSignInEmail = sendSignInEmail;
exports.api = api;
exports.webhook = webhook;
exports.setAssociatedMovementsCronJob = setAssociatedMovementsCronJob;
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
