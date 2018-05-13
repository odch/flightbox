'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({
  origin: true,
});

const modes = require('./modes');
const requestHelper = require('./util/requestHelper');
const errors = require('./util/errors');

const config = functions.config();

if (!config.serviceaccount || !config.serviceaccount.clientemail) {
  throw new Error('Required configuration property `serviceaccount.clientemail` not defined');
}

if (!config.serviceaccount || !config.serviceaccount.privatekey) {
  throw new Error('Required configuration property `serviceaccount.privatekey` not defined');
} else if (!config.serviceaccount.privatekey.match(/^".*"$/)) {
  throw new Error('Configuration property `serviceaccount.privatekey` must be wrapped in double quotes')
}

admin.initializeApp({
  credential: admin.credential.cert({
    clientEmail: config.serviceaccount.clientemail,
    privateKey: JSON.parse(config.serviceaccount.privatekey)
  })
});

const sendToken = (res, token) => {
  res.send({
    token: token
  })
};

const createAndSendToken = (req, res, uid) => {
  const additionalClaims = {
    ip: requestHelper.getIp(req)
  };
  return admin.auth().createCustomToken(uid, additionalClaims)
    .then(customToken => {
      sendToken(res, customToken)
    });
};

const onRequest = (allowed, handler) =>
  functions.https.onRequest((req, res) =>
    cors(req, res, () => {
      if (allowed.includes(req.method)) {
        return handler(req, res);
      } else if (req.method === 'OPTIONS') {
        res.send();
      } else {
        res.status(405).send();
      }
    })
  );

module.exports = onRequest(['POST'], (req, res) => {
  try {
    const mode = requestHelper.requireBodyProperty(req, 'mode');
    const handler = modes[mode];
    if (!handler) {
      const availableModes = Object.keys(modes).join(', ');
      throw new errors.ClientError('Invalid mode "' + mode + '" given. Available modes: ' + availableModes + '.');
    }

    return handler(req, res).then((uid) => {
      if (uid) {
        return createAndSendToken(req, res, uid);
      } else {
        sendToken(res, null)
      }
    });
  } catch (err) {
    if (err instanceof errors.ClientError) {
      errors.sendClientError(res, err.message);
    } else {
      errors.sendServerError(res, 'Failed to execute authentication', err);
    }
  }
});
