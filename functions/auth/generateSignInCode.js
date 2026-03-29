'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const crypto = require('crypto');
const cors = require('cors')({origin: true});
const { sendSignInEmail } = require('./sendSignInEmail');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

const hashCode = (code) => {
  return crypto.createHash('sha256').update(code).digest('hex');
};

const validateRequest = (method, body) => {
  if (method !== 'POST') {
    return { error: 'Method not allowed', status: 405 };
  }

  const { email } = body;

  if (!email) {
    return { error: 'Email is required', status: 400 };
  }

  if (!EMAIL_REGEX.test(email)) {
    return { error: 'Invalid email format', status: 400 };
  }

  return null;
};

exports.generateSignInCode = functions.region('europe-west1').https.onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      const validationError = validateRequest(req.method, req.body);
      if (validationError) {
        return res.status(validationError.status).json({ error: validationError.error });
      }

      const { email, airportName, themeColor } = req.body;
      const normalizedEmail = email.toLowerCase();

      const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
      const codeHash = hashCode(code);
      const expiry = Date.now() + CODE_EXPIRY_MS;

      await admin.database().ref('/signInCodes').push({
        email: normalizedEmail,
        codeHash,
        expiry,
        attempts: 0,
      });

      await sendSignInEmail({ email: normalizedEmail, signInCode: code, airportName, themeColor });

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error generating sign-in code:', error);
      res.status(500).json({
        error: 'Failed to send sign-in code',
      });
    }
  });
});
