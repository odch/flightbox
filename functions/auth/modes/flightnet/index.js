'use strict';

const functions = require('firebase-functions');
const flightnet = require('./flightnet');
const requestHelper = require('../../util/requestHelper');

const parseTestCredentials = () => {
  const config = functions.config();
  if (config.auth && config.auth.testcredentials) {
    const username = config.auth.testcredentials.username;
    const password = config.auth.testcredentials.password;

    if (!username) {
      throw new Error('Required configuration property `username` not defined in `auth.testcredentials`');
    }
    if (!password) {
      throw new Error('Required configuration property `password` not defined in `auth.testcredentials`');
    }

    return {
      username: username,
      password: password
    };
  }
  return null;
};

const testCredentials = parseTestCredentials();

module.exports = req => {
  const username = requestHelper.requireBodyProperty(req, 'username');
  const password = requestHelper.requireBodyProperty(req, 'password');

  if (testCredentials) {
    const uid = testCredentials.username && password === testCredentials.password ? username : null;
    return Promise.resolve(uid);
  } else {
    const company = requestHelper.requireBodyProperty(req, 'company');
    return flightnet.passwordCheck(company, username, password)
      .then(success => success ? username : null)
  }
};
