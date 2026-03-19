'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({origin: true});

const TEST_EMAIL = 'cypress-pilot@example.com';

exports.createTestEmailToken = functions.region('europe-west1').https.onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      const config = functions.config();
      if (!config.testing || !config.testing.enabled) {
        return res.status(403).json({ error: 'Testing endpoints are not enabled' });
      }

      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      let uid;
      try {
        const userRecord = await admin.auth().getUserByEmail(TEST_EMAIL);
        uid = userRecord.uid;
      } catch (e) {
        if (e.code === 'auth/user-not-found') {
          const newUser = await admin.auth().createUser({ email: TEST_EMAIL });
          uid = newUser.uid;
        } else {
          throw e;
        }
      }

      const customToken = await admin.auth().createCustomToken(uid, { email: TEST_EMAIL });
      res.status(200).json({ token: customToken });
    } catch (error) {
      console.error('Error creating test email token:', error);
      res.status(500).json({ error: 'Failed to create test email token' });
    }
  });
});
