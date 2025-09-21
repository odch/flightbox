const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({origin: true});

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateRequest = (method, body) => {
  if (method !== 'POST') {
    return { error: 'Method not allowed', status: 405 };
  }

  const { email, continueUrl } = body;

  if (!email) {
    return { error: 'Email is required', status: 400 };
  }

  if (!continueUrl) {
    return { error: 'Continue URL is required', status: 400 };
  }

  if (!EMAIL_REGEX.test(email)) {
    return { error: 'Invalid email format', status: 400 };
  }

  return null;
};

exports.generateSignInLink = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      const validationError = validateRequest(req.method, req.body);
      if (validationError) {
        return res.status(validationError.status).json({ error: validationError.error });
      }

      const { email, continueUrl } = req.body;

      const actionCodeSettings = {
        url: continueUrl,
        handleCodeInApp: true,
      };

      const signInLink = await admin.auth().generateSignInWithEmailLink(email, actionCodeSettings);

      res.status(200).json({ signInLink, email });
    } catch (error) {
      console.error('Error generating sign-in link:', error);
      res.status(500).json({
        error: 'Failed to generate sign-in link',
        details: error.message
      });
    }
  });
});
