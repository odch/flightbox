'use strict';

const requestHelper = require('../../util/requestHelper');
const admin = require('firebase-admin')

module.exports = req =>
  new Promise(async resolve => {
    const receivedToken = requestHelper.requireBodyProperty(req, 'token');
    const expectedToken = await admin.database()
      .ref('/settings/kioskAccessToken')
      .once('value')
    if (receivedToken && receivedToken === expectedToken.val()) {
      resolve('kiosk');
    } else {
      resolve(null);
    }
  });
