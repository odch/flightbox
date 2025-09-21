const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({origin: true});
const nodemailer = require('nodemailer');
const { getSignInEmailContent } = require('./emailTemplates');

const REQUIRED_SMTP_SETTINGS = ['host', 'port', 'user', 'password', 'fromEmail', 'fromName'];

const validateRequest = (method, body) => {
  if (method !== 'POST') {
    return { error: 'Method not allowed', status: 405 };
  }

  const { email, signInLink } = body;
  if (!email || !signInLink) {
    return { error: 'Email and signInLink are required', status: 400 };
  }

  return null;
};

const loadSmtpSettings = async () => {
  const snapshot = await admin.database().ref('/settings/emailSmtp').once('value');
  const settings = snapshot.val();

  if (!settings) {
    throw new Error('SMTP settings not found in database at /settings/emailSmtp');
  }

  const missingSettings = REQUIRED_SMTP_SETTINGS.filter(setting => !settings[setting]);
  if (missingSettings.length > 0) {
    throw new Error(`Missing SMTP settings: ${missingSettings.join(', ')}`);
  }

  return settings;
};

const createTransporter = (settings) => {
  return nodemailer.createTransport({
    host: settings.host,
    port: parseInt(settings.port),
    secure: true,
    auth: {
      user: settings.user,
      pass: settings.password,
    },
  });
};

exports.sendSignInEmail = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      const validationError = validateRequest(req.method, req.body);
      if (validationError) {
        return res.status(validationError.status).json({ error: validationError.error });
      }

      const { email, signInLink, airportName, themeColor } = req.body;

      const smtpSettings = await loadSmtpSettings();
      const emailContent = getSignInEmailContent({ signInLink, airportName, themeColor });
      const transporter = createTransporter(smtpSettings);

      const info = await transporter.sendMail({
        from: `"${smtpSettings.fromName}" <${smtpSettings.fromEmail}>`,
        to: email,
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html,
      });

      console.log('Sign-in email sent successfully:', info.messageId);

      res.status(200).json({
        success: true,
        message: 'Sign-in email sent successfully',
        messageId: info.messageId
      });
    } catch (error) {
      console.error('Error sending sign-in email:', error);
      res.status(500).json({
        error: 'Failed to send sign-in email',
        details: error.message
      });
    }
  });
});
