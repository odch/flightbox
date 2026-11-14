'use strict'

jest.mock('../../email/smtp', () => ({
  loadSmtpSettings: jest.fn().mockResolvedValue({
    host: 'smtp.example.com',
    port: '587',
    user: 'user@example.com',
    password: 'secret',
    fromEmail: 'noreply@example.com',
    fromName: 'Flightbox'
  }),
  createTransporter: jest.fn()
}))
jest.mock('../deployConfig', () => ({
  pprBranding: jest.fn(),
  pprAppOrigin: jest.fn()
}))

const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'msg-1' })

const { loadSmtpSettings, createTransporter } = require('../../email/smtp')
const { pprBranding, pprAppOrigin } = require('../deployConfig')

createTransporter.mockReturnValue({ sendMail: mockSendMail })

const { notifyRequestSubmitted, notifyRequestReviewed } = require('./emailNotifier')

const configReadsAtLoad = pprBranding.mock.calls.length + pprAppOrigin.mock.calls.length

const basePprRequest = {
  key: 'req-123',
  firstname: 'Max',
  lastname: 'Muster',
  email: 'max@example.com',
  immatriculation: 'HB-ABC',
  plannedDate: '2026-04-15',
  plannedTime: '10:30',
  flightType: 'private'
}

const UNBRANDED = { aerodromeName: '', themeColor: '#000000' }
const BRANDING = { aerodromeName: 'Langenthal', themeColor: '#027ABB' }

describe('emailNotifier', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    createTransporter.mockReturnValue({ sendMail: mockSendMail })
    pprBranding.mockReturnValue(UNBRANDED)
    pprAppOrigin.mockReturnValue(null)
  })

  describe('notifyRequestSubmitted', () => {
    it('sends email to admin', async () => {
      await notifyRequestSubmitted(basePprRequest, 'admin@aero.ch')

      expect(mockSendMail).toHaveBeenCalledTimes(1)
      const mailArgs = mockSendMail.mock.calls[0][0]
      expect(mailArgs.to).toBe('admin@aero.ch')
      expect(mailArgs.subject).toContain('PPR-Anfrage')
      expect(mailArgs.html).toContain('HB-ABC')
      expect(mailArgs.text).toContain('HB-ABC')
    })

    it('uses SMTP from settings', async () => {
      await notifyRequestSubmitted(basePprRequest, 'admin@aero.ch')

      expect(loadSmtpSettings).toHaveBeenCalled()
      expect(createTransporter).toHaveBeenCalled()
      const mailArgs = mockSendMail.mock.calls[0][0]
      expect(mailArgs.from).toBe('"Flightbox" <noreply@example.com>')
    })
  })

  describe('notifyRequestReviewed', () => {
    it('sends approved email to pilot', async () => {
      await notifyRequestReviewed({ ...basePprRequest, status: 'approved' })

      const mailArgs = mockSendMail.mock.calls[0][0]
      expect(mailArgs.to).toBe('max@example.com')
      expect(mailArgs.subject).toContain('genehmigt')
    })

    it('sends rejected email to pilot with remarks', async () => {
      await notifyRequestReviewed({
        ...basePprRequest,
        status: 'rejected',
        reviewRemarks: 'Bad weather'
      })

      const mailArgs = mockSendMail.mock.calls[0][0]
      expect(mailArgs.to).toBe('max@example.com')
      expect(mailArgs.subject).toContain('abgelehnt')
      expect(mailArgs.html).toContain('Bad weather')
    })

    it('sends the revocation of an approval to the pilot', async () => {
      await notifyRequestReviewed({ ...basePprRequest, status: 'revoked', reviewRemarks: 'Runway works' })

      const mailArgs = mockSendMail.mock.calls[0][0]
      expect(mailArgs.to).toBe('max@example.com')
      expect(mailArgs.subject).toBe('PPR widerrufen: HB-ABC am 2026-04-15')
      expect(mailArgs.text).toContain('Grund: Runway works')
    })

    it('sends nothing for a pending request', async () => {
      await expect(notifyRequestReviewed({ ...basePprRequest, status: 'pending' }))
        .rejects.toThrow('No email for PPR status pending')
      expect(mockSendMail).not.toHaveBeenCalled()
    })
  })

  describe('aerodrome branding', () => {
    beforeEach(() => {
      pprBranding.mockReturnValue(BRANDING)
    })

    it('is passed to the admin email', async () => {
      await notifyRequestSubmitted({ ...basePprRequest, status: 'pending' }, 'admin@aero.ch')

      const mailArgs = mockSendMail.mock.calls[0][0]
      expect(mailArgs.subject).toBe('PPR-Anfrage: HB-ABC am 2026-04-15')
      expect(mailArgs.html).toContain('background: #027ABB;')
      expect(mailArgs.html).toContain('opacity: 0.9;">Langenthal</p>')
      expect(mailArgs.text.split('\n')[0]).toBe('Flightbox – Langenthal')
    })

    it.each([
      ['approved', 'PPR genehmigt: HB-ABC am 2026-04-15 – Langenthal'],
      ['rejected', 'PPR abgelehnt: HB-ABC am 2026-04-15 – Langenthal'],
      ['revoked', 'PPR widerrufen: HB-ABC am 2026-04-15 – Langenthal']
    ])('is passed to the pilot email for %s', async (status, subject) => {
      await notifyRequestReviewed({ ...basePprRequest, status, reviewRemarks: 'Runway works' })

      const mailArgs = mockSendMail.mock.calls[0][0]
      expect(mailArgs.subject).toBe(subject)
      expect(mailArgs.html).toContain('background: #027ABB;')
      expect(mailArgs.text.split('\n')[0]).toBe('Flightbox – Langenthal')
    })

    it('is read for each email, not when the notifier is loaded', async () => {
      expect(configReadsAtLoad).toBe(0)

      await notifyRequestReviewed({ ...basePprRequest, status: 'approved' })
      pprBranding.mockReturnValue(UNBRANDED)
      await notifyRequestReviewed({ ...basePprRequest, status: 'approved' })

      expect(pprBranding).toHaveBeenCalledTimes(2)
      expect(mockSendMail.mock.calls[0][0].subject).toBe('PPR genehmigt: HB-ABC am 2026-04-15 – Langenthal')
      expect(mockSendMail.mock.calls[1][0].subject).toBe('PPR genehmigt: HB-ABC am 2026-04-15')
    })
  })

  describe('link to the request in the admin email', () => {
    const pending = { ...basePprRequest, status: 'pending' }
    const ADMIN_URL = 'https://lspl-test.web.app/#/admin?tab=ppr&request=req-123'

    beforeEach(() => {
      pprBranding.mockReturnValue(BRANDING)
      pprAppOrigin.mockReturnValue('https://lspl-test.web.app')
    })

    it('opens a pending request in the admin area of the app', async () => {
      await notifyRequestSubmitted(pending, 'admin@aero.ch')

      const mailArgs = mockSendMail.mock.calls[0][0]
      expect(mailArgs.text).toContain(`\nPPR-Anfrage beantworten: ${ADMIN_URL}\n`)
      expect(mailArgs.html).toContain('<a href="https://lspl-test.web.app/#/admin?tab=ppr&amp;request=req-123" ' +
        'style="display: inline-block; padding: 12px 24px; background-color: #027ABB;')
      expect(mailArgs.html).toContain('opacity: 0.9;">Langenthal</p>')
    })

    it('reads the app address for each email', async () => {
      await notifyRequestSubmitted(pending, 'admin@aero.ch')
      pprAppOrigin.mockReturnValue('https://flightbox.example')
      await notifyRequestSubmitted(pending, 'admin@aero.ch')

      expect(pprAppOrigin).toHaveBeenCalledTimes(2)
      expect(mockSendMail.mock.calls[1][0].text)
        .toContain('PPR-Anfrage beantworten: https://flightbox.example/#/admin?tab=ppr&request=req-123')
    })

    it('is left out without the app address', async () => {
      pprAppOrigin.mockReturnValue(null)
      await notifyRequestSubmitted(pending, 'admin@aero.ch')

      const mailArgs = mockSendMail.mock.calls[0][0]
      expect(mailArgs.text).not.toContain('beantworten')
      expect(mailArgs.html).not.toContain('<a ')
    })

    it('is left out for an answered request', async () => {
      await notifyRequestSubmitted({ ...basePprRequest, status: 'approved', reviewedBy: 'automatic' }, 'admin@aero.ch')

      const mailArgs = mockSendMail.mock.calls[0][0]
      expect(mailArgs.text).toContain('Antwort: Automatisch genehmigt')
      expect(mailArgs.text).not.toContain('beantworten')
      expect(mailArgs.html).not.toContain('<a ')
    })

    it.each([['an invalid key', '../../etc'], ['no key', undefined]])('is left out for %s', async (name, key) => {
      await notifyRequestSubmitted({ ...pending, key }, 'admin@aero.ch')

      expect(mockSendMail.mock.calls[0][0].text).not.toContain('beantworten')
    })

    it('is not in the pilot emails', async () => {
      await notifyRequestReviewed({ ...basePprRequest, status: 'approved' })

      expect(pprAppOrigin).not.toHaveBeenCalled()
      expect(mockSendMail.mock.calls[0][0].html).not.toContain('lspl-test.web.app')
    })
  })
})
