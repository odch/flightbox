'use strict'

const fs = require('fs')
const path = require('path')
const { flightTypeLabel } = require('./flightTypeLabels')
const { AUTOMATIC_REVIEWER, Status } = require('../domain/pprRequest')
const { sanitizeThemeColor } = require('../../email/themeColor')

const PLACEHOLDER_REGEX = /\{\{(\w+)\}\}/g

function escapeHtml(str) {
  if (typeof str !== 'string') return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function replacePlaceholders(content, replacements) {
  return content.replace(PLACEHOLDER_REGEX, (match, key) => {
    return replacements[key] !== undefined ? replacements[key] : match
  })
}

function readTemplate(templateName, format) {
  const templatePath = path.join(__dirname, 'templates', `${templateName}.${format}`)
  return fs.readFileSync(templatePath, 'utf8')
}

// The pilot's emails use the language stored with the request; German is
// the default (also for requests stored before the language was added).
function isEnglish(pprRequest) {
  return pprRequest.language === 'en'
}

function localizedTemplate(templateName, pprRequest, format) {
  return readTemplate(isEnglish(pprRequest) ? `${templateName}_en` : templateName, format)
}

// Dates as the app shows them (dates.formatDate in src/util/dates.ts), in
// both languages: '2026-11-20' becomes '20.11.2026'
function displayDate(value) {
  const match = typeof value === 'string' ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(value) : null
  return match ? `${match[3]}.${match[2]}.${match[1]}` : value
}

function isAutomatic(pprRequest) {
  return pprRequest.reviewedBy === AUTOMATIC_REVIEWER
}

// Every builder takes the aerodrome's branding as its context (pprBranding()
// in deployConfig.js): { aerodromeName, themeColor }. An unknown name is left
// out, an unknown or invalid colour becomes the default.
function branding(context) {
  const { aerodromeName, themeColor } = context || {}
  return {
    aerodromeName: typeof aerodromeName === 'string' ? aerodromeName.trim() : '',
    themeColor: sanitizeThemeColor(themeColor)
  }
}

// The header of every PPR email, like the sign-in email's: "Flightbox" on the
// theme colour with the aerodrome's name below; the first line in text.
function headerReplacements({ aerodromeName, themeColor }) {
  return {
    html: {
      themeColor,
      aerodromeHtml: aerodromeName
        ? `\n      <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">${escapeHtml(aerodromeName)}</p>`
        : ''
    },
    text: {
      headerText: aerodromeName ? `Flightbox – ${aerodromeName}` : 'Flightbox'
    }
  }
}

// The pilot's subjects end with the aerodrome's name when it is known: a
// pilot may have requests at several aerodromes.
function pilotSubject(subject, { aerodromeName }) {
  return aerodromeName ? `${subject} – ${aerodromeName}` : subject
}

// How the request was answered, for the aerodrome
function answerLine(pprRequest) {
  if (pprRequest.status === 'approved') {
    return 'Automatisch genehmigt'
  }
  if (pprRequest.status === 'rejected') {
    return pprRequest.reviewRemarks
      ? `Automatisch abgelehnt: ${pprRequest.reviewRemarks}`
      : 'Automatisch abgelehnt'
  }
  return 'Offen, bitte im Admin-Bereich genehmigen oder ablehnen'
}

const NO_FRAGMENT = Object.freeze({ html: '', text: '' })

// The links come from adminLinks.js. Only https URLs of printable ASCII are
// linked: in the text emails a link is a line of its own, which no space or
// line break in it may end early.
function isLinkableUrl(url) {
  return typeof url === 'string' && /^https:\/\/[\x21-\x7e]+$/.test(url)
}

// A link as a button in the theme colour below the details (html), and as a
// line of its own (text)
function linkFragment(url, label, themeColor) {
  const style = `display: inline-block; padding: 12px 24px; background-color: ${themeColor}; ` +
    'color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: 600;'
  return {
    html: '\n      <p style="margin: 30px 0 10px 0; text-align: center;">' +
      `\n        <a href="${escapeHtml(url)}" style="${style}">${label}</a>` +
      '\n      </p>',
    text: `\n\n${label}: ${url}`
  }
}

// A pending request gets a link that opens it in the app's admin area, where
// an admin answers it (context.reviewUrl). Answered requests, and emails
// without the app's address, get none.
function reviewLink(pprRequest, reviewUrl, themeColor) {
  if (pprRequest.status !== Status.PENDING || !isLinkableUrl(reviewUrl)) {
    return NO_FRAGMENT
  }
  return linkFragment(reviewUrl, 'PPR-Anfrage beantworten', themeColor)
}

// The pilot's emails link to the status page of the request
// (context.statusUrl); emails without the app's address have no link.
function statusLink(statusUrl, themeColor, english) {
  if (!isLinkableUrl(statusUrl)) {
    return NO_FRAGMENT
  }
  return linkFragment(statusUrl, english ? 'Show status' : 'Status anzeigen', themeColor)
}

// A note below the link to the status
function noteFragment(note) {
  return {
    html: `\n      <p style="margin: 20px 0 0 0; font-size: 14px; color: #666;">${note}</p>`,
    text: `\n\n${note}`
  }
}

// The receipt may reach someone who did not make the request: the address of
// a request without login is not confirmed. They can withdraw it with the
// status link, so the note only comes with the link.
function withdrawNote(english) {
  return noteFragment(english
    ? 'If you did not make this request, you can withdraw it using the link or ignore this email.'
    : 'Falls Sie diese Anfrage nicht gestellt haben, können Sie sie über den Link zurückziehen oder diese E-Mail ignorieren.')
}

// A request without login answered on submission gets its answer without a
// receipt before it: the answer tells whoever did not make the request that
// they can ignore it (an answered request can't be withdrawn).
function ignoreNote(pprRequest) {
  if (pprRequest.withoutLogin !== true || !isAutomatic(pprRequest)) {
    return NO_FRAGMENT
  }
  return noteFragment(isEnglish(pprRequest)
    ? 'If you did not make this request, you can ignore this email.'
    : 'Falls Sie diese Anfrage nicht gestellt haben, können Sie diese E-Mail ignorieren.')
}

// Anyone can enter any address in a request without login: the aerodrome
// should know that nobody confirmed it before answering.
function withoutLoginNote(pprRequest) {
  if (pprRequest.withoutLogin !== true) {
    return NO_FRAGMENT
  }
  const note = 'Ohne Anmeldung gestellt – E-Mail-Adresse nicht bestätigt'
  return {
    html: '\n      <div style="margin-top: 20px; padding: 15px; background-color: #fff8e1; border-left: 4px solid #ffc107; border-radius: 4px;">' +
      `\n        <p style="margin: 0; font-size: 15px;">${note}</p>` +
      '\n      </div>',
    text: `\n\n${note}`
  }
}

// Goes to the aerodrome's PPR address, whose language is not known: German.
// The context has the branding and, for the link, reviewUrl.
function getPprSubmittedEmail(pprRequest, context = {}) {
  const brand = branding(context)
  const header = headerReplacements(brand)
  const { reviewUrl } = context || {}
  const link = reviewLink(pprRequest, reviewUrl, brand.themeColor)
  const withoutLogin = withoutLoginNote(pprRequest)
  const answer = answerLine(pprRequest)

  const replacements = {
    ...header.html,
    pilotName: escapeHtml(`${pprRequest.firstname} ${pprRequest.lastname}`),
    immatriculation: escapeHtml(pprRequest.immatriculation),
    plannedDate: escapeHtml(displayDate(pprRequest.plannedDate)),
    plannedTime: escapeHtml(pprRequest.plannedTime),
    flightType: escapeHtml(flightTypeLabel(pprRequest.flightType)),
    answer: escapeHtml(answer),
    withoutLoginHtml: withoutLogin.html,
    reviewLinkHtml: link.html
  }

  const plainReplacements = {
    ...header.text,
    pilotName: `${pprRequest.firstname} ${pprRequest.lastname}`,
    immatriculation: pprRequest.immatriculation,
    plannedDate: displayDate(pprRequest.plannedDate),
    plannedTime: pprRequest.plannedTime,
    flightType: flightTypeLabel(pprRequest.flightType),
    answer,
    withoutLoginText: withoutLogin.text,
    reviewLinkText: link.text
  }

  return {
    subject: `PPR-Anfrage: ${pprRequest.immatriculation} am ${displayDate(pprRequest.plannedDate)}`,
    html: replacePlaceholders(readTemplate('ppr-submitted', 'html'), replacements),
    text: replacePlaceholders(readTemplate('ppr-submitted', 'txt'), plainReplacements)
  }
}

// Remarks are optional on approval (e.g. conditions), so the block only
// appears when there are some. Automatic approvals carry the information for
// pilots and a note that current conditions still apply.
function approvalRemarks(pprRequest) {
  const english = isEnglish(pprRequest)
  const automatic = isAutomatic(pprRequest)
  const remarks = pprRequest.reviewRemarks
  const result = { html: '', text: '' }

  if (remarks) {
    const label = automatic
      ? (english ? 'Information for pilots:' : 'Hinweise für Piloten:')
      : (english ? 'Remarks:' : 'Bemerkung:')
    result.html += '\n      <div style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #28a745; border-radius: 4px;">' +
      `\n        <p style="margin: 0 0 5px 0; font-size: 14px; color: #666;">${label}</p>` +
      `\n        <p style="margin: 0; font-size: 15px; white-space: pre-line;">${escapeHtml(remarks)}</p>` +
      '\n      </div>'
    result.text += automatic ? `\n\n${label}\n${remarks}` : `\n\n${label} ${remarks}`
  }

  if (automatic) {
    const note = english
      ? 'This request was approved automatically. Please check the current aerodrome status and the NOTAMs before the flight.'
      : 'Diese Anfrage wurde automatisch genehmigt. Bitte prüfen Sie vor dem Flug den aktuellen Flugplatzstatus und die NOTAM.'
    result.html += `\n      <p style="margin: 20px 0 0 0; font-size: 14px; color: #666;">${note}</p>`
    result.text += `\n\n${note}`
  }

  return result
}

// The pilot's emails below take the branding and, for the link to the
// request's status, statusUrl as their context.

// Confirms a pending request. It shows only the flight: the address of a
// request without login may be someone else's.
function getPprReceivedEmail(pprRequest, context = {}) {
  const brand = branding(context)
  const header = headerReplacements(brand)
  const english = isEnglish(pprRequest)
  const { statusUrl } = context || {}
  const link = statusLink(statusUrl, brand.themeColor, english)
  const note = link.text ? withdrawNote(english) : NO_FRAGMENT

  const replacements = {
    ...header.html,
    immatriculation: escapeHtml(pprRequest.immatriculation),
    plannedDate: escapeHtml(displayDate(pprRequest.plannedDate)),
    plannedTime: escapeHtml(pprRequest.plannedTime),
    statusLinkHtml: link.html + note.html
  }

  const plainReplacements = {
    ...header.text,
    immatriculation: pprRequest.immatriculation,
    plannedDate: displayDate(pprRequest.plannedDate),
    plannedTime: pprRequest.plannedTime,
    statusLinkText: link.text + note.text
  }

  const subject = english
    ? `PPR request received: ${pprRequest.immatriculation} on ${displayDate(pprRequest.plannedDate)}`
    : `PPR-Anfrage erhalten: ${pprRequest.immatriculation} am ${displayDate(pprRequest.plannedDate)}`

  return {
    subject: pilotSubject(subject, brand),
    html: replacePlaceholders(localizedTemplate('ppr-received', pprRequest, 'html'), replacements),
    text: replacePlaceholders(localizedTemplate('ppr-received', pprRequest, 'txt'), plainReplacements)
  }
}

function getPprApprovedEmail(pprRequest, context = {}) {
  const brand = branding(context)
  const header = headerReplacements(brand)
  const remarks = approvalRemarks(pprRequest)
  const { statusUrl } = context || {}
  const link = statusLink(statusUrl, brand.themeColor, isEnglish(pprRequest))
  const note = ignoreNote(pprRequest)

  const replacements = {
    ...header.html,
    immatriculation: escapeHtml(pprRequest.immatriculation),
    plannedDate: escapeHtml(displayDate(pprRequest.plannedDate)),
    plannedTime: escapeHtml(pprRequest.plannedTime),
    remarksHtml: remarks.html,
    statusLinkHtml: link.html + note.html
  }

  const plainReplacements = {
    ...header.text,
    immatriculation: pprRequest.immatriculation,
    plannedDate: displayDate(pprRequest.plannedDate),
    plannedTime: pprRequest.plannedTime,
    remarksText: remarks.text,
    statusLinkText: link.text + note.text
  }

  const subject = isEnglish(pprRequest)
    ? `PPR approved: ${pprRequest.immatriculation} on ${displayDate(pprRequest.plannedDate)}`
    : `PPR genehmigt: ${pprRequest.immatriculation} am ${displayDate(pprRequest.plannedDate)}`

  return {
    subject: pilotSubject(subject, brand),
    html: replacePlaceholders(localizedTemplate('ppr-approved', pprRequest, 'html'), replacements),
    text: replacePlaceholders(localizedTemplate('ppr-approved', pprRequest, 'txt'), plainReplacements)
  }
}

function getPprRejectedEmail(pprRequest, context = {}) {
  const brand = branding(context)
  const header = headerReplacements(brand)
  const remarks = pprRequest.reviewRemarks || '-'
  const { statusUrl } = context || {}
  const link = statusLink(statusUrl, brand.themeColor, isEnglish(pprRequest))
  const note = ignoreNote(pprRequest)

  const replacements = {
    ...header.html,
    immatriculation: escapeHtml(pprRequest.immatriculation),
    plannedDate: escapeHtml(displayDate(pprRequest.plannedDate)),
    plannedTime: escapeHtml(pprRequest.plannedTime),
    reviewRemarks: escapeHtml(remarks),
    statusLinkHtml: link.html + note.html
  }

  const plainReplacements = {
    ...header.text,
    immatriculation: pprRequest.immatriculation,
    plannedDate: displayDate(pprRequest.plannedDate),
    plannedTime: pprRequest.plannedTime,
    reviewRemarks: remarks,
    statusLinkText: link.text + note.text
  }

  const subject = isEnglish(pprRequest)
    ? `PPR rejected: ${pprRequest.immatriculation} on ${displayDate(pprRequest.plannedDate)}`
    : `PPR abgelehnt: ${pprRequest.immatriculation} am ${displayDate(pprRequest.plannedDate)}`

  return {
    subject: pilotSubject(subject, brand),
    html: replacePlaceholders(localizedTemplate('ppr-rejected', pprRequest, 'html'), replacements),
    text: replacePlaceholders(localizedTemplate('ppr-rejected', pprRequest, 'txt'), plainReplacements)
  }
}

function getPprRevokedEmail(pprRequest, context = {}) {
  const brand = branding(context)
  const header = headerReplacements(brand)
  const remarks = pprRequest.reviewRemarks || '-'
  const { statusUrl } = context || {}
  const link = statusLink(statusUrl, brand.themeColor, isEnglish(pprRequest))

  const replacements = {
    ...header.html,
    immatriculation: escapeHtml(pprRequest.immatriculation),
    plannedDate: escapeHtml(displayDate(pprRequest.plannedDate)),
    plannedTime: escapeHtml(pprRequest.plannedTime),
    reviewRemarks: escapeHtml(remarks),
    statusLinkHtml: link.html
  }

  const plainReplacements = {
    ...header.text,
    immatriculation: pprRequest.immatriculation,
    plannedDate: displayDate(pprRequest.plannedDate),
    plannedTime: pprRequest.plannedTime,
    reviewRemarks: remarks,
    statusLinkText: link.text
  }

  const subject = isEnglish(pprRequest)
    ? `PPR revoked: ${pprRequest.immatriculation} on ${displayDate(pprRequest.plannedDate)}`
    : `PPR widerrufen: ${pprRequest.immatriculation} am ${displayDate(pprRequest.plannedDate)}`

  return {
    subject: pilotSubject(subject, brand),
    html: replacePlaceholders(localizedTemplate('ppr-revoked', pprRequest, 'html'), replacements),
    text: replacePlaceholders(localizedTemplate('ppr-revoked', pprRequest, 'txt'), plainReplacements)
  }
}

module.exports = {
  getPprSubmittedEmail,
  getPprReceivedEmail,
  getPprApprovedEmail,
  getPprRejectedEmail,
  getPprRevokedEmail,
  escapeHtml
}
