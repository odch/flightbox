'use strict'

const { loadSmtpSettings, createTransporter } = require('../../email/smtp')
const {
  getPprSubmittedEmail,
  getPprApprovedEmail,
  getPprRejectedEmail
} = require('./emailTemplates')

async function sendEmail(to, emailContent) {
  const smtpSettings = await loadSmtpSettings()
  const transporter = createTransporter(smtpSettings)

  await transporter.sendMail({
    from: `"${smtpSettings.fromName}" <${smtpSettings.fromEmail}>`,
    to,
    subject: emailContent.subject,
    text: emailContent.text,
    html: emailContent.html
  })
}

async function notifyRequestSubmitted(pprRequest, adminEmail) {
  const emailContent = getPprSubmittedEmail(pprRequest)
  await sendEmail(adminEmail, emailContent)
}

async function notifyRequestReviewed(pprRequest) {
  const emailContent = pprRequest.status === 'approved'
    ? getPprApprovedEmail(pprRequest)
    : getPprRejectedEmail(pprRequest)
  await sendEmail(pprRequest.email, emailContent)
}

module.exports = {
  notifyRequestSubmitted,
  notifyRequestReviewed
}
