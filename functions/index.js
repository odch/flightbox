'use strict';

const admin = require('firebase-admin');

admin.initializeApp();

const auth = require('./auth');
const api = require('./api');
const webhook = require('./webhook');
const setAssociatedMovementsCronJob = require('./associatedMovements/setAssociatedMovementsCronJob');
const associatedMovementsTriggers = require('./associatedMovements/setAssociatedMovementsTriggers');

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
