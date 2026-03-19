'use strict'

const {
  getPprSubmittedEmail,
  getPprApprovedEmail,
  getPprRejectedEmail,
  escapeHtml
} = require('./emailTemplates')

const basePprRequest = {
  firstname: 'Max',
  lastname: 'Muster',
  email: 'max@example.com',
  immatriculation: 'HB-ABC',
  plannedDate: '2026-04-15',
  plannedTime: '10:30',
  flightType: 'private'
}

describe('PPR emailTemplates', () => {
  describe('escapeHtml', () => {
    it('escapes HTML special characters', () => {
      expect(escapeHtml('<script>"alert"</script>')).toBe('&lt;script&gt;&quot;alert&quot;&lt;/script&gt;')
    })

    it('escapes ampersands', () => {
      expect(escapeHtml('A & B')).toBe('A &amp; B')
    })

    it('returns empty string for non-string input', () => {
      expect(escapeHtml(null)).toBe('')
      expect(escapeHtml(undefined)).toBe('')
    })
  })

  describe('getPprSubmittedEmail', () => {
    it('returns subject with immatriculation and date', () => {
      const result = getPprSubmittedEmail(basePprRequest)
      expect(result.subject).toBe('PPR-Anfrage: HB-ABC am 2026-04-15')
    })

    it('includes pilot name in HTML', () => {
      const result = getPprSubmittedEmail(basePprRequest)
      expect(result.html).toContain('Max Muster')
    })

    it('includes pilot name in text', () => {
      const result = getPprSubmittedEmail(basePprRequest)
      expect(result.text).toContain('Max Muster')
    })

    it('includes aircraft and flight details', () => {
      const result = getPprSubmittedEmail(basePprRequest)
      expect(result.html).toContain('HB-ABC')
      expect(result.html).toContain('2026-04-15')
      expect(result.html).toContain('10:30')
      expect(result.html).toContain('private')
    })

    it('escapes HTML in user-supplied fields', () => {
      const xssRequest = {
        ...basePprRequest,
        firstname: '<script>alert("xss")</script>',
        lastname: 'Test'
      }
      const result = getPprSubmittedEmail(xssRequest)
      expect(result.html).not.toContain('<script>')
      expect(result.html).toContain('&lt;script&gt;')
    })

    it('does not escape text/plain version', () => {
      const result = getPprSubmittedEmail(basePprRequest)
      expect(result.text).not.toContain('&amp;')
    })
  })

  describe('getPprApprovedEmail', () => {
    it('returns subject with approved status', () => {
      const result = getPprApprovedEmail(basePprRequest)
      expect(result.subject).toBe('PPR genehmigt: HB-ABC am 2026-04-15')
    })

    it('includes aircraft and date in HTML', () => {
      const result = getPprApprovedEmail(basePprRequest)
      expect(result.html).toContain('HB-ABC')
      expect(result.html).toContain('2026-04-15')
      expect(result.html).toContain('10:30')
    })

    it('does not include pilot name', () => {
      const result = getPprApprovedEmail(basePprRequest)
      expect(result.html).not.toContain('Max Muster')
    })
  })

  describe('getPprRejectedEmail', () => {
    it('returns subject with rejected status', () => {
      const result = getPprRejectedEmail(basePprRequest)
      expect(result.subject).toBe('PPR abgelehnt: HB-ABC am 2026-04-15')
    })

    it('includes review remarks in HTML', () => {
      const result = getPprRejectedEmail({
        ...basePprRequest,
        reviewRemarks: 'Weather conditions'
      })
      expect(result.html).toContain('Weather conditions')
    })

    it('includes review remarks in text', () => {
      const result = getPprRejectedEmail({
        ...basePprRequest,
        reviewRemarks: 'Weather conditions'
      })
      expect(result.text).toContain('Weather conditions')
    })

    it('uses dash when no remarks provided', () => {
      const result = getPprRejectedEmail(basePprRequest)
      expect(result.text).toContain('Bemerkung: -')
    })

    it('escapes HTML in review remarks', () => {
      const result = getPprRejectedEmail({
        ...basePprRequest,
        reviewRemarks: '<img src=x onerror=alert(1)>'
      })
      expect(result.html).not.toContain('<img')
      expect(result.html).toContain('&lt;img')
    })
  })
})
