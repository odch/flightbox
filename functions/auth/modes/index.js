'use strict';

const ip = require('./ip');
const flightnet = require('./flightnet');
const guest_token = require('./guest_token');

module.exports = {
  ip: ip,
  flightnet: flightnet,
  guest_token: guest_token
};
