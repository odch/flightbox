'use strict'

const fs = require('fs')
const path = require('path')
const { flightTypeLabel } = require('./flightTypeLabels')

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

// Goes to the aerodrome's PPR address, whose language is not known: German.
function getPprSubmittedEmail(pprRequest) {
  const replacements = {
    pilotName: escapeHtml(`${pprRequest.firstname} ${pprRequest.lastname}`),
    immatriculation: escapeHtml(pprRequest.immatriculation),
    plannedDate: escapeHtml(pprRequest.plannedDate),
    plannedTime: escapeHtml(pprRequest.plannedTime),
    flightType: escapeHtml(flightTypeLabel(pprRequest.flightType))
  }

  const plainReplacements = {
    pilotName: `${pprRequest.firstname} ${pprRequest.lastname}`,
    immatriculation: pprRequest.immatriculation,
    plannedDate: pprRequest.plannedDate,
    plannedTime: pprRequest.plannedTime,
    flightType: flightTypeLabel(pprRequest.flightType)
  }

  return {
    subject: `PPR-Anfrage: ${pprRequest.immatriculation} am ${pprRequest.plannedDate}`,
    html: replacePlaceholders(readTemplate('ppr-submitted', 'html'), replacements),
    text: replacePlaceholders(readTemplate('ppr-submitted', 'txt'), plainReplacements)
  }
}

// Remarks are optional on approval (e.g. conditions), so the block only
// appears when there are some.
function approvalRemarks(pprRequest) {
  const remarks = pprRequest.reviewRemarks
  if (!remarks) {
    return { html: '', text: '' }
  }
  const label = isEnglish(pprRequest) ? 'Remarks:' : 'Bemerkung:'
  return {
    html: '\n      <div style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #28a745; border-radius: 4px;">' +
      `\n        <p style="margin: 0 0 5px 0; font-size: 14px; color: #666;">${label}</p>` +
      `\n        <p style="margin: 0; font-size: 15px;">${escapeHtml(remarks)}</p>` +
      '\n      </div>',
    text: `\n\n${label} ${remarks}`
  }
}

function getPprApprovedEmail(pprRequest) {
  const remarks = approvalRemarks(pprRequest)

  const replacements = {
    immatriculation: escapeHtml(pprRequest.immatriculation),
    plannedDate: escapeHtml(pprRequest.plannedDate),
    plannedTime: escapeHtml(pprRequest.plannedTime),
    remarksHtml: remarks.html
  }

  const plainReplacements = {
    immatriculation: pprRequest.immatriculation,
    plannedDate: pprRequest.plannedDate,
    plannedTime: pprRequest.plannedTime,
    remarksText: remarks.text
  }

  return {
    subject: isEnglish(pprRequest)
      ? `PPR approved: ${pprRequest.immatriculation} on ${pprRequest.plannedDate}`
      : `PPR genehmigt: ${pprRequest.immatriculation} am ${pprRequest.plannedDate}`,
    html: replacePlaceholders(localizedTemplate('ppr-approved', pprRequest, 'html'), replacements),
    text: replacePlaceholders(localizedTemplate('ppr-approved', pprRequest, 'txt'), plainReplacements)
  }
}

function getPprRejectedEmail(pprRequest) {
  const remarks = pprRequest.reviewRemarks || '-'

  const replacements = {
    immatriculation: escapeHtml(pprRequest.immatriculation),
    plannedDate: escapeHtml(pprRequest.plannedDate),
    plannedTime: escapeHtml(pprRequest.plannedTime),
    reviewRemarks: escapeHtml(remarks)
  }

  const plainReplacements = {
    immatriculation: pprRequest.immatriculation,
    plannedDate: pprRequest.plannedDate,
    plannedTime: pprRequest.plannedTime,
    reviewRemarks: remarks
  }

  return {
    subject: isEnglish(pprRequest)
      ? `PPR rejected: ${pprRequest.immatriculation} on ${pprRequest.plannedDate}`
      : `PPR abgelehnt: ${pprRequest.immatriculation} am ${pprRequest.plannedDate}`,
    html: replacePlaceholders(localizedTemplate('ppr-rejected', pprRequest, 'html'), replacements),
    text: replacePlaceholders(localizedTemplate('ppr-rejected', pprRequest, 'txt'), plainReplacements)
  }
}

module.exports = {
  getPprSubmittedEmail,
  getPprApprovedEmail,
  getPprRejectedEmail,
  escapeHtml
}
