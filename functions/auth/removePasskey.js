'use strict';

const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });
const {
  AuthError,
  verifyAuthenticatedUser,
} = require('./webauthnHelpers');

exports.removeWebauthnCredential = onRequest({ region: 'europe-west1' }, (req, res) => {
  return cors(req, res, async () => {
    try {
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      let authContext;
      try {
        authContext = await verifyAuthenticatedUser(req);
      } catch (e) {
        if (e instanceof AuthError) {
          return res.status(401).json({ error: e.message });
        }
        throw e;
      }

      const { uid } = authContext;
      const { credentialId } = req.body || {};

      if (!credentialId || typeof credentialId !== 'string') {
        return res.status(400).json({ error: 'credentialId is required' });
      }

      const credentialRef = admin.database()
        .ref('/webauthnCredentials').child(uid).child(credentialId);
      const snapshot = await credentialRef.once('value');
      if (!snapshot.exists()) {
        return res.status(404).json({ error: 'Credential not found' });
      }

      const ownerRef = admin.database().ref('/webauthnCredentialOwners').child(credentialId);
      const ownerSnap = await ownerRef.once('value');
      if (ownerSnap.exists()) {
        const ownerVal = ownerSnap.val() || {};
        if (ownerVal.uid && ownerVal.uid !== uid) {
          return res.status(403).json({ error: 'Not owner of credential' });
        }
      }

      await credentialRef.remove();
      await ownerRef.remove();

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error removing passkey:', error);
      res.status(500).json({ error: 'Failed to remove passkey' });
    }
  });
});
