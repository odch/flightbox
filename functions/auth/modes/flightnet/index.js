'use strict';

const flightnet = require('./flightnet');
const requestHelper = require('../../util/requestHelper');

const parseStaticCredentials = () => {
  const raw = process.env.AUTH_STATIC_CREDENTIALS;
  if (raw) {
    return raw.split(',').map(login => {
      const parts = login.split(':');
      return {
        username: parts[0],
        password: parts[1]
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
