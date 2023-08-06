'use strict';

const admin = require('firebase-admin');

admin.initializeApp();

const auth = require('./auth');
const api = require('./api');
const webhook = require('./webhook');
const setAssociatedMovementsCronJob = require('./associatedMovements/setAssociatedMovementsCronJob');

exports.auth = auth;
exports.api = api;
exports.webhook = webhook;
exports.setAssociatedMovementsCronJob = setAssociatedMovementsCronJob;
