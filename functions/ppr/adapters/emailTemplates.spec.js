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
    })

    it('shows the German flight type label, not the internal value', () => {
      const result = getPprSubmittedEmail({ ...basePprRequest, flightType: 'glider_private_aerotow' })
      expect(result.html).toContain('>Privat (Schlepp)<')
      expect(result.text).toContain('Flugart: Privat (Schlepp)')
      expect(result.html).not.toContain('glider_private_aerotow')
      expect(result.text).not.toContain('glider_private_aerotow')
    })

    it('shows an unknown flight type as it is', () => {
      const result = getPprSubmittedEmail({ ...basePprRequest, flightType: 'balloon' })
      expect(result.text).toContain('Flugart: balloon')
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

    it('includes the admin\'s remarks, escaped, when there are some', () => {
      const result = getPprApprovedEmail({ ...basePprRequest, reviewRemarks: 'RWY 26 only <b>' })
      expect(result.html).toContain('Bemerkung:')
      expect(result.html).toContain('RWY 26 only &lt;b&gt;')
      expect(result.text).toContain('Bemerkung: RWY 26 only <b>')
    })

    it('includes the remarks in English emails too', () => {
      const result = getPprApprovedEmail({ ...basePprRequest, language: 'en', reviewRemarks: 'RWY 26 only' })
      expect(result.html).toContain('Remarks:')
      expect(result.text).toContain('Remarks: RWY 26 only')
    })

    it('leaves out the remarks block when there are none', () => {
      const result = getPprApprovedEmail(basePprRequest)
      expect(result.html).not.toContain('Bemerkung')
      expect(result.text).not.toContain('Bemerkung')
      expect(result.html).not.toMatch(/\{\{\w+\}\}/)
      expect(result.text).not.toMatch(/\{\{\w+\}\}/)
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

  describe('pilot language', () => {
    const english = { ...basePprRequest, language: 'en' }

    it('sends the approval in English when the pilot used English', () => {
      const result = getPprApprovedEmail(english)
      expect(result.subject).toBe('PPR approved: HB-ABC on 2026-04-15')
      expect(result.html).toContain('<html lang="en">')
      expect(result.html).toContain('Your PPR request has been approved.')
      expect(result.text).toContain('Your PPR request has been approved.')
      expect(result.text).toContain('Aircraft: HB-ABC')
    })

    it('sends the rejection in English when the pilot used English', () => {
      const result = getPprRejectedEmail({ ...english, reviewRemarks: 'Runway closed' })
      expect(result.subject).toBe('PPR rejected: HB-ABC on 2026-04-15')
      expect(result.html).toContain('<html lang="en">')
      expect(result.html).toContain('Runway closed')
      expect(result.text).toContain('Remarks: Runway closed')
    })

    it.each([undefined, 'de', 'fr'])('sends German pilot emails for language %p', language => {
      const request = { ...basePprRequest, language }
      expect(getPprApprovedEmail(request).subject).toBe('PPR genehmigt: HB-ABC am 2026-04-15')
      expect(getPprRejectedEmail(request).html).toContain('<html lang="de">')
    })

    it('keeps the admin notification in German', () => {
      const result = getPprSubmittedEmail(english)
      expect(result.subject).toBe('PPR-Anfrage: HB-ABC am 2026-04-15')
      expect(result.html).toContain('<html lang="de">')
    })

    it('escapes HTML in the English templates too', () => {
      const result = getPprRejectedEmail({ ...english, reviewRemarks: '<img src=x onerror=alert(1)>' })
      expect(result.html).not.toContain('<img')
      expect(result.html).toContain('&lt;img')
    })

    it('fills every placeholder in the English templates', () => {
      for (const result of [getPprApprovedEmail(english), getPprRejectedEmail(english)]) {
        expect(result.html).not.toMatch(/\{\{\w+\}\}/)
        expect(result.text).not.toMatch(/\{\{\w+\}\}/)
      }
    })
  })
})
