'use strict';

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

  if (!staticCredentials) {
    return Promise.resolve(null);
  }

  const match = staticCredentials.find(login => login.username === username && login.password === password);
  return Promise.resolve(match ? username : null);
};
