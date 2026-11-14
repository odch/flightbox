'use strict'

const fs = require('fs')
const path = require('path')
const { flightTypeLabel } = require('./flightTypeLabels')
const { AUTOMATIC_REVIEWER } = require('../domain/pprRequest')
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

// Goes to the aerodrome's PPR address, whose language is not known: German.
function getPprSubmittedEmail(pprRequest, context = {}) {
  const header = headerReplacements(branding(context))
  const answer = answerLine(pprRequest)

  const replacements = {
    ...header.html,
    pilotName: escapeHtml(`${pprRequest.firstname} ${pprRequest.lastname}`),
    immatriculation: escapeHtml(pprRequest.immatriculation),
    plannedDate: escapeHtml(pprRequest.plannedDate),
    plannedTime: escapeHtml(pprRequest.plannedTime),
    flightType: escapeHtml(flightTypeLabel(pprRequest.flightType)),
    answer: escapeHtml(answer)
  }

  const plainReplacements = {
    ...header.text,
    pilotName: `${pprRequest.firstname} ${pprRequest.lastname}`,
    immatriculation: pprRequest.immatriculation,
    plannedDate: pprRequest.plannedDate,
    plannedTime: pprRequest.plannedTime,
    flightType: flightTypeLabel(pprRequest.flightType),
    answer
  }

  return {
    subject: `PPR-Anfrage: ${pprRequest.immatriculation} am ${pprRequest.plannedDate}`,
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

function getPprApprovedEmail(pprRequest, context = {}) {
  const brand = branding(context)
  const header = headerReplacements(brand)
  const remarks = approvalRemarks(pprRequest)

  const replacements = {
    ...header.html,
    immatriculation: escapeHtml(pprRequest.immatriculation),
    plannedDate: escapeHtml(pprRequest.plannedDate),
    plannedTime: escapeHtml(pprRequest.plannedTime),
    remarksHtml: remarks.html
  }

  const plainReplacements = {
    ...header.text,
    immatriculation: pprRequest.immatriculation,
    plannedDate: pprRequest.plannedDate,
    plannedTime: pprRequest.plannedTime,
    remarksText: remarks.text
  }

  const subject = isEnglish(pprRequest)
    ? `PPR approved: ${pprRequest.immatriculation} on ${pprRequest.plannedDate}`
    : `PPR genehmigt: ${pprRequest.immatriculation} am ${pprRequest.plannedDate}`

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

  const replacements = {
    ...header.html,
    immatriculation: escapeHtml(pprRequest.immatriculation),
    plannedDate: escapeHtml(pprRequest.plannedDate),
    plannedTime: escapeHtml(pprRequest.plannedTime),
    reviewRemarks: escapeHtml(remarks)
  }

  const plainReplacements = {
    ...header.text,
    immatriculation: pprRequest.immatriculation,
    plannedDate: pprRequest.plannedDate,
    plannedTime: pprRequest.plannedTime,
    reviewRemarks: remarks
  }

  const subject = isEnglish(pprRequest)
    ? `PPR rejected: ${pprRequest.immatriculation} on ${pprRequest.plannedDate}`
    : `PPR abgelehnt: ${pprRequest.immatriculation} am ${pprRequest.plannedDate}`

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

  const replacements = {
    ...header.html,
    immatriculation: escapeHtml(pprRequest.immatriculation),
    plannedDate: escapeHtml(pprRequest.plannedDate),
    plannedTime: escapeHtml(pprRequest.plannedTime),
    reviewRemarks: escapeHtml(remarks)
  }

  const plainReplacements = {
    ...header.text,
    immatriculation: pprRequest.immatriculation,
    plannedDate: pprRequest.plannedDate,
    plannedTime: pprRequest.plannedTime,
    reviewRemarks: remarks
  }

  const subject = isEnglish(pprRequest)
    ? `PPR revoked: ${pprRequest.immatriculation} on ${pprRequest.plannedDate}`
    : `PPR widerrufen: ${pprRequest.immatriculation} am ${pprRequest.plannedDate}`

  return {
    subject: pilotSubject(subject, brand),
    html: replacePlaceholders(localizedTemplate('ppr-revoked', pprRequest, 'html'), replacements),
    text: replacePlaceholders(localizedTemplate('ppr-revoked', pprRequest, 'txt'), plainReplacements)
  }
}

module.exports = {
  getPprSubmittedEmail,
  getPprApprovedEmail,
  getPprRejectedEmail,
  getPprRevokedEmail,
  escapeHtml
}
