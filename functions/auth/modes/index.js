'use strict';

const flightnet = require('./flightnet');
const guest_token = require('./guest_token');
const kiosk_token = require('./kiosk_token');

module.exports = {
  flightnet: flightnet,
  guest_token: guest_token,
  kiosk_token: kiosk_token
};
