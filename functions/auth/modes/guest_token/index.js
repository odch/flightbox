'use strict';

const requestHelper = require('../../util/requestHelper');
const admin = require('firebase-admin')

module.exports = req =>
  new Promise(async resolve => {
    const receivedToken = requestHelper.requireBodyProperty(req, 'token');
    const expectedToken = await admin.database()
      .ref('/settings/guestAccessToken')
      .once('value')
    if (receivedToken && receivedToken === expectedToken.val()) {
      resolve('guest');
    } else {
      resolve(null);
    }
  });
