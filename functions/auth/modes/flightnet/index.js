'use strict';

const functions = require('firebase-functions');
const flightnet = require('./flightnet');
const requestHelper = require('../../util/requestHelper');

const parseStaticCredentials = () => {
  const config = functions.config();
  if (config.auth && config.auth.staticcredentials) {
    return config.auth.staticcredentials.split(',').map(login => {
      const parts = login.split(':');

      const username = parts[0];
      const password = parts[1];

      return {
        username: username,
        password: password
      };
    })
  }
  return null;
};

const staticCredentials = parseStaticCredentials();

module.exports = req => {
  const username = requestHelper.requireBodyProperty(req, 'username');
  const password = requestHelper.requireBodyProperty(req, 'password');

  if (staticCredentials) {
    const match = staticCredentials.find(login => login.username === username && login.password === password);
    const uid = match ? username : null;
    return Promise.resolve(uid);
  } else {
    const company = requestHelper.requireBodyProperty(req, 'company');
    return flightnet.passwordCheck(company, username, password)
      .then(success => success ? username : null)
  }
};
