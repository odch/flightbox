'use strict'

const { loadSmtpSettings, createTransporter } = require('../../email/smtp')
const {
  getPprSubmittedEmail,
  getPprApprovedEmail,
  getPprRejectedEmail,
  getPprRevokedEmail
} = require('./emailTemplates')

const REVIEW_EMAILS = {
  approved: getPprApprovedEmail,
  rejected: getPprRejectedEmail,
  revoked: getPprRevokedEmail
}

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

// The answer to the pilot: approved, rejected or a revoked approval
async function notifyRequestReviewed(pprRequest) {
  const getEmail = REVIEW_EMAILS[pprRequest.status]
  if (!getEmail) {
    throw new Error(`No email for PPR status ${pprRequest.status}`)
  }
  await sendEmail(pprRequest.email, getEmail(pprRequest))
}

module.exports = {
  notifyRequestSubmitted,
  notifyRequestReviewed
}
