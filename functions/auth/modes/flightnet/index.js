'use strict';

const flightnet = require('./flightnet');
const requestHelper = require('../../util/requestHelper');

module.exports = req => {
  const company = requestHelper.requireBodyProperty(req, 'company');
  const username = requestHelper.requireBodyProperty(req, 'username');
  const password = requestHelper.requireBodyProperty(req, 'password');

  return flightnet.passwordCheck(company, username, password)
    .then(success => success ? username : null)
};
