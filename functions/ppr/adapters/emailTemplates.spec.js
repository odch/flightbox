'use strict'

const {
  getPprSubmittedEmail,
  getPprApprovedEmail,
  getPprRejectedEmail,
  getPprRevokedEmail,
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

  describe('answer in the aerodrome\'s email', () => {
    it('asks the admins to answer a pending request', () => {
      const result = getPprSubmittedEmail({ ...basePprRequest, status: 'pending' })
      expect(result.text).toContain('Antwort: Offen, bitte im Admin-Bereich genehmigen oder ablehnen')
    })

    it('tells about an automatic approval', () => {
      const result = getPprSubmittedEmail({ ...basePprRequest, status: 'approved', reviewedBy: 'automatic' })
      expect(result.text).toContain('Antwort: Automatisch genehmigt')
      expect(result.html).toContain('Automatisch genehmigt')
    })

    it('tells about an automatic rejection with its reason, escaped', () => {
      const result = getPprSubmittedEmail({
        ...basePprRequest, status: 'rejected', reviewedBy: 'automatic', reviewRemarks: 'Runway <works>'
      })
      expect(result.text).toContain('Antwort: Automatisch abgelehnt: Runway <works>')
      expect(result.html).toContain('Automatisch abgelehnt: Runway &lt;works&gt;')
    })
  })

  describe('automatic approval', () => {
    const automatic = { ...basePprRequest, status: 'approved', reviewedBy: 'automatic' }

    it('carries the information for pilots with its line breaks and a note', () => {
      const result = getPprApprovedEmail({ ...automatic, reviewRemarks: 'Runway 05/23\nLanding fee CHF 20' })
      expect(result.html).toContain('Hinweise für Piloten:')
      expect(result.html).toContain('white-space: pre-line;">Runway 05/23\nLanding fee CHF 20</p>')
      expect(result.html).toContain('Diese Anfrage wurde automatisch genehmigt.')
      expect(result.text).toContain('Hinweise für Piloten:\nRunway 05/23\nLanding fee CHF 20')
      expect(result.text).toContain('Bitte prüfen Sie vor dem Flug den aktuellen Flugplatzstatus und die NOTAM.')
    })

    it('has the note also without information for pilots', () => {
      const result = getPprApprovedEmail(automatic)
      expect(result.text).not.toContain('Hinweise für Piloten')
      expect(result.text).toContain('Diese Anfrage wurde automatisch genehmigt.')
      expect(result.text).not.toMatch(/\{\{\w+\}\}/)
    })

    it('is in English for English requests', () => {
      const result = getPprApprovedEmail({ ...automatic, language: 'en', reviewRemarks: 'Runway 05/23' })
      expect(result.text).toContain('Information for pilots:\nRunway 05/23')
      expect(result.text).toContain('This request was approved automatically.')
    })

    it('keeps the admin\'s remarks label for an approval by an admin', () => {
      const result = getPprApprovedEmail({ ...basePprRequest, reviewedBy: 'admin@aero.ch', reviewRemarks: 'RWY 26 only' })
      expect(result.text).toContain('Bemerkung: RWY 26 only')
      expect(result.text).not.toContain('automatisch')
    })
  })

  describe('getPprRevokedEmail', () => {
    const revoked = { ...basePprRequest, status: 'revoked', reviewRemarks: 'Closed: runway <works>' }

    it('tells the pilot that the approval was revoked, with the reason', () => {
      const result = getPprRevokedEmail(revoked)
      expect(result.subject).toBe('PPR widerrufen: HB-ABC am 2026-04-15')
      expect(result.text).toContain('Ihre PPR-Genehmigung wurde leider widerrufen.')
      expect(result.text).toContain('Grund: Closed: runway <works>')
      expect(result.html).toContain('Closed: runway &lt;works&gt;')
      expect(result.text).not.toMatch(/\{\{\w+\}\}/)
      expect(result.html).not.toMatch(/\{\{\w+\}\}/)
    })

    it('is in English for English requests', () => {
      const result = getPprRevokedEmail({ ...revoked, language: 'en' })
      expect(result.subject).toBe('PPR revoked: HB-ABC on 2026-04-15')
      expect(result.html).toContain('<html lang="en">')
      expect(result.text).toContain('Unfortunately, your PPR approval has been revoked.')
      expect(result.text).toContain('Reason: Closed: runway <works>')
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

  describe('aerodrome branding', () => {
    const BRANDING = { aerodromeName: 'Langenthal', themeColor: '#027ABB' }
    const english = { ...basePprRequest, language: 'en' }

    // Every template: the admin's, and the pilot's in both languages, with
    // the status heading and its colour
    const EMAILS = [
      ['submitted', getPprSubmittedEmail, { ...basePprRequest, status: 'pending' }, 'Neue PPR-Anfrage', '#333'],
      ['approved', getPprApprovedEmail, { ...basePprRequest, status: 'approved' }, 'PPR-Anfrage genehmigt', '#28a745'],
      ['approved (en)', getPprApprovedEmail, { ...english, status: 'approved' }, 'PPR request approved', '#28a745'],
      ['rejected', getPprRejectedEmail, { ...basePprRequest, status: 'rejected' }, 'PPR-Anfrage abgelehnt', '#dc3545'],
      ['rejected (en)', getPprRejectedEmail, { ...english, status: 'rejected' }, 'PPR request rejected', '#dc3545'],
      ['revoked', getPprRevokedEmail, { ...basePprRequest, status: 'revoked' }, 'PPR-Genehmigung widerrufen', '#dc3545'],
      ['revoked (en)', getPprRevokedEmail, { ...english, status: 'revoked' }, 'PPR approval revoked', '#dc3545']
    ]

    const headerStart = color =>
      `<div style="background: ${color}; color: white; padding: 20px 30px; text-align: center;">\n` +
      '      <h1 style="margin: 0; font-size: 28px; font-weight: 300;">Flightbox</h1>'

    it.each(EMAILS)('%s: has the header of the sign-in email with the aerodrome name', (name, getEmail, request) => {
      const { html, text } = getEmail(request, BRANDING)
      expect(html).toContain(headerStart('#027ABB') +
        '\n      <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Langenthal</p>\n    </div>')
      expect(text.startsWith('Flightbox – Langenthal\n\n')).toBe(true)
      expect(html).not.toMatch(/\{\{\w+\}\}/)
      expect(text).not.toMatch(/\{\{\w+\}\}/)
    })

    it.each(EMAILS)('%s: has no subtitle and the default colour without branding', (name, getEmail, request, title) => {
      for (const context of [undefined, null, {}, { aerodromeName: '' }, { aerodromeName: '  ' }]) {
        const { html, text } = getEmail(request, context)
        expect(html).toContain(headerStart('#000000') + '\n    </div>')
        expect(html).not.toContain('opacity: 0.9')
        expect(text.split('\n').slice(0, 3)).toEqual(['Flightbox', '', title])
        expect(html).not.toMatch(/\{\{\w+\}\}/)
        expect(text).not.toMatch(/\{\{\w+\}\}/)
      }
    })

    it.each(EMAILS)('%s: starts the body with the status, in the colour of the answer', (name, getEmail, request, title, color) => {
      const { html, text } = getEmail(request, BRANDING)
      expect(html).toContain('<div style="padding: 20px 30px;">\n' +
        `      <h2 style="margin: 10px 0 0 0; font-size: 22px; font-weight: 600; color: ${color};">${title}</h2>`)
      expect(html.split(title)).toHaveLength(3) // in the <title> and the heading only
      expect(text.split('\n').slice(0, 3)).toEqual(['Flightbox – Langenthal', '', title])
    })

    it.each(EMAILS)('%s: escapes the aerodrome name in HTML only', (name, getEmail, request) => {
      const { html, text } = getEmail(request, { aerodromeName: 'A & <B>', themeColor: '#027ABB' })
      expect(html).toContain('opacity: 0.9;">A &amp; &lt;B&gt;</p>')
      expect(html).not.toContain('<B>')
      expect(text.split('\n')[0]).toBe('Flightbox – A & <B>')
    })

    it.each([
      undefined,
      '',
      42,
      'rgb(2, 122, 187)',
      'red; } </style><script>alert(1)</script>',
      'red" onload="alert(1)'
    ])('uses the default colour instead of %p', themeColor => {
      for (const [, getEmail, request] of EMAILS) {
        const { html } = getEmail(request, { aerodromeName: 'Langenthal', themeColor })
        expect(html).toContain(headerStart('#000000'))
        expect(html).not.toContain('<script>')
        expect(html).not.toContain('onload')
      }
    })

    it('keeps a colour name', () => {
      expect(getPprApprovedEmail(basePprRequest, { themeColor: 'navy' }).html).toContain(headerStart('navy'))
    })

    it.each([
      ['approved', getPprApprovedEmail, basePprRequest, 'PPR genehmigt: HB-ABC am 2026-04-15'],
      ['approved (en)', getPprApprovedEmail, english, 'PPR approved: HB-ABC on 2026-04-15'],
      ['rejected', getPprRejectedEmail, basePprRequest, 'PPR abgelehnt: HB-ABC am 2026-04-15'],
      ['rejected (en)', getPprRejectedEmail, english, 'PPR rejected: HB-ABC on 2026-04-15'],
      ['revoked', getPprRevokedEmail, basePprRequest, 'PPR widerrufen: HB-ABC am 2026-04-15'],
      ['revoked (en)', getPprRevokedEmail, english, 'PPR revoked: HB-ABC on 2026-04-15']
    ])('ends the pilot subject (%s) with the aerodrome name when it is known', (name, getEmail, request, subject) => {
      expect(getEmail(request, BRANDING).subject).toBe(`${subject} – Langenthal`)
      expect(getEmail(request, { aerodromeName: 'A & <B>' }).subject).toBe(`${subject} – A & <B>`)
      expect(getEmail(request, { themeColor: '#027ABB' }).subject).toBe(subject)
      expect(getEmail(request).subject).toBe(subject)
    })

    it('keeps the subject of the admin email as it is', () => {
      expect(getPprSubmittedEmail(basePprRequest, BRANDING).subject).toBe('PPR-Anfrage: HB-ABC am 2026-04-15')
    })
  })
})
