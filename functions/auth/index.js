'use strict';

const { onRequest: v2OnRequest } = require('firebase-functions/v2/https');
const { getAuth } = require('firebase-admin/auth');
const cors = require('cors')({
  origin: true,
});

const modes = require('./modes');
const requestHelper = require('./util/requestHelper');
const errors = require('./util/errors');

const sendToken = (res, token) => {
  res.send({
    token: token
  })
};

const createAndSendToken = (req, res, uid) => {
  return getAuth().createCustomToken(uid)
    .then(customToken => {
      sendToken(res, customToken)
    });
};

const onRequest = (allowed, handler) =>
  v2OnRequest({ region: 'europe-west1' }, (req, res) =>
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
