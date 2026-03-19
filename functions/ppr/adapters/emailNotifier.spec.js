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

const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'msg-1' })

const { loadSmtpSettings, createTransporter } = require('../../email/smtp')

createTransporter.mockReturnValue({ sendMail: mockSendMail })

const { notifyRequestSubmitted, notifyRequestReviewed } = require('./emailNotifier')

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

describe('emailNotifier', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    createTransporter.mockReturnValue({ sendMail: mockSendMail })
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
  })
})
