'use strict'

const fs = require('fs')
const path = require('path')

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

function getPprSubmittedEmail(pprRequest) {
  const replacements = {
    pilotName: escapeHtml(`${pprRequest.firstname} ${pprRequest.lastname}`),
    immatriculation: escapeHtml(pprRequest.immatriculation),
    plannedDate: escapeHtml(pprRequest.plannedDate),
    plannedTime: escapeHtml(pprRequest.plannedTime),
    flightType: escapeHtml(pprRequest.flightType)
  }

  const plainReplacements = {
    pilotName: `${pprRequest.firstname} ${pprRequest.lastname}`,
    immatriculation: pprRequest.immatriculation,
    plannedDate: pprRequest.plannedDate,
    plannedTime: pprRequest.plannedTime,
    flightType: pprRequest.flightType
  }

  return {
    subject: `PPR-Anfrage: ${pprRequest.immatriculation} am ${pprRequest.plannedDate}`,
    html: replacePlaceholders(readTemplate('ppr-submitted', 'html'), replacements),
    text: replacePlaceholders(readTemplate('ppr-submitted', 'txt'), plainReplacements)
  }
}

function getPprApprovedEmail(pprRequest) {
  const replacements = {
    immatriculation: escapeHtml(pprRequest.immatriculation),
    plannedDate: escapeHtml(pprRequest.plannedDate),
    plannedTime: escapeHtml(pprRequest.plannedTime)
  }

  const plainReplacements = {
    immatriculation: pprRequest.immatriculation,
    plannedDate: pprRequest.plannedDate,
    plannedTime: pprRequest.plannedTime
  }

  return {
    subject: `PPR genehmigt: ${pprRequest.immatriculation} am ${pprRequest.plannedDate}`,
    html: replacePlaceholders(readTemplate('ppr-approved', 'html'), replacements),
    text: replacePlaceholders(readTemplate('ppr-approved', 'txt'), plainReplacements)
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
    subject: `PPR abgelehnt: ${pprRequest.immatriculation} am ${pprRequest.plannedDate}`,
    html: replacePlaceholders(readTemplate('ppr-rejected', 'html'), replacements),
    text: replacePlaceholders(readTemplate('ppr-rejected', 'txt'), plainReplacements)
  }
}

module.exports = {
  getPprSubmittedEmail,
  getPprApprovedEmail,
  getPprRejectedEmail,
  escapeHtml
}
