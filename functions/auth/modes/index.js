'use strict';

const staticMode = require('./static');
const guest_token = require('./guest_token');
const kiosk_token = require('./kiosk_token');

module.exports = {
  static: staticMode,
  guest_token: guest_token,
  kiosk_token: kiosk_token
};
