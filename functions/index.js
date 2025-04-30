'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');

const dbInstance = functions.config().rtdb.instance;

admin.initializeApp({
  databaseURL: `https://${dbInstance}.firebaseio.com`
});

const auth = require('./auth');
const api = require('./api');
const webhook = require('./webhook');
const setAssociatedMovementsCronJob = require('./associatedMovements/setAssociatedMovementsCronJob');
const associatedMovementsTriggers = require('./associatedMovements/setAssociatedMovementsTriggers');
const invoiceRecipientsTrigger = require('./invoiceRecipients/invoiceRecipientsTrigger');

exports.auth = auth;
exports.api = api;
exports.webhook = webhook;
exports.setAssociatedMovementsCronJob = setAssociatedMovementsCronJob;
exports.setAssociatedMovementOnCreatedDeparture = associatedMovementsTriggers.setAssociatedMovementOnCreatedDeparture;
exports.setAssociatedMovementOnCreatedArrival = associatedMovementsTriggers.setAssociatedMovementOnCreatedArrival;
exports.setAssociatedMovementOnUpdatedDeparture = associatedMovementsTriggers.setAssociatedMovementOnUpdatedDeparture;
exports.setAssociatedMovementOnUpdatedArrival = associatedMovementsTriggers.setAssociatedMovementOnUpdatedArrival;
exports.setAssociatedMovementOnDeletedDeparture = associatedMovementsTriggers.setAssociatedMovementOnDeletedDeparture;
exports.setAssociatedMovementOnDeletedArrival = associatedMovementsTriggers.setAssociatedMovementOnDeletedArrival;
exports.updateCustomsInvoiceRecipientsOnUpdate = invoiceRecipientsTrigger.updateCustomsInvoiceRecipientsOnUpdate;
