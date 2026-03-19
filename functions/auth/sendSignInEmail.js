'use strict';

const { loadSmtpSettings, createTransporter } = require('../email/smtp');
const { getSignInEmailContent } = require('./emailTemplates');

const sendSignInEmail = async ({ email, signInCode, airportName, themeColor }) => {
  const smtpSettings = await loadSmtpSettings();
  const emailContent = getSignInEmailContent({ signInCode, airportName, themeColor });
  const transporter = createTransporter(smtpSettings);

  const info = await transporter.sendMail({
    from: `"${smtpSettings.fromName}" <${smtpSettings.fromEmail}>`,
    to: email,
    subject: emailContent.subject,
    text: emailContent.text,
    html: emailContent.html,
  });

  return info.messageId;
};

module.exports = { sendSignInEmail, loadSmtpSettings, createTransporter };
