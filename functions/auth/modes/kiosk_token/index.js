'use strict';

const requestHelper = require('../../util/requestHelper');
const { getDatabase } = require('firebase-admin/database')

module.exports = req =>
  new Promise(async resolve => {
    const receivedToken = requestHelper.requireBodyProperty(req, 'token');
    const expectedToken = await getDatabase()
      .ref('/settings/kioskAccessToken')
      .once('value')
    if (receivedToken && receivedToken === expectedToken.val()) {
      resolve('kiosk');
    } else {
      resolve(null);
    }
  });
