'use strict';

const requestHelper = require('../../util/requestHelper');
const { getDatabase } = require('firebase-admin/database')

module.exports = req =>
  new Promise(async resolve => {
    const receivedToken = requestHelper.requireBodyProperty(req, 'token');
    const expectedToken = await getDatabase()
      .ref('/settings/guestAccessToken')
      .once('value')
    if (receivedToken && receivedToken === expectedToken.val()) {
      resolve('guest');
    } else {
      resolve(null);
    }
  });
