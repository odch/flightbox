'use strict'

const {
  Status,
  MAX_LENGTHS,
  createPprRequest,
  sanitizeReviewRemarks,
  validateStatusTransition,
  stripHtml,
  sanitizeString
} = require('./pprRequest')

const NOW = new Date('2026-04-01T12:00:00Z').getTime()

const validInput = {
  firstname: 'Max',
  lastname: 'Muster',
  email: 'max@example.com',
  immatriculation: 'HB-ABC',
  plannedDate: '2026-04-15',
  plannedTime: '10:30',
  flightType: 'private',
  createdBy: 'max@example.com'
}

describe('pprRequest', () => {
  describe('createPprRequest', () => {
    it('creates a valid PPR request with required fields', () => {
      const result = createPprRequest(validInput, NOW)

      expect(result).toEqual({
        status: Status.PENDING,
        firstname: 'Max',
        lastname: 'Muster',
        email: 'max@example.com',
        immatriculation: 'HB-ABC',
        plannedDate: '2026-04-15',
        plannedTime: '10:30',
        flightType: 'private',
        createdBy: 'max@example.com',
        createdAt: NOW,
        negativeTimestamp: -NOW
      })
    })

    it('includes optional phone when provided', () => {
      const result = createPprRequest({ ...validInput, phone: '+41791234567' }, NOW)
      expect(result.phone).toBe('+41791234567')
    })

    it('includes optional aircraftType when provided', () => {
      const result = createPprRequest({ ...validInput, aircraftType: 'PA-28' }, NOW)
      expect(result.aircraftType).toBe('PA-28')
    })

    it('includes optional mtow when provided', () => {
      const result = createPprRequest({ ...validInput, mtow: 1200 }, NOW)
      expect(result.mtow).toBe(1200)
    })

    it('includes optional remarks when provided', () => {
      const result = createPprRequest({ ...validInput, remarks: 'Training flight' }, NOW)
      expect(result.remarks).toBe('Training flight')
    })

    it('omits optional fields when not provided', () => {
      const result = createPprRequest(validInput, NOW)
      expect(result.phone).toBeUndefined()
      expect(result.aircraftType).toBeUndefined()
      expect(result.mtow).toBeUndefined()
      expect(result.remarks).toBeUndefined()
    })

    it('uppercases immatriculation', () => {
      const result = createPprRequest({ ...validInput, immatriculation: 'hb-abc' }, NOW)
      expect(result.immatriculation).toBe('HB-ABC')
    })

    describe('required field validation', () => {
      it.each([
        'firstname', 'lastname', 'email', 'immatriculation',
        'plannedDate', 'plannedTime', 'flightType'
      ])('throws when %s is missing', (field) => {
        const input = { ...validInput }
        delete input[field]
        expect(() => createPprRequest(input, NOW)).toThrow('Missing required fields')
      })

      it('throws when a required field is empty string', () => {
        expect(() => createPprRequest({ ...validInput, firstname: '' }, NOW))
          .toThrow('Missing required fields')
      })

      it('throws when a required field is whitespace only', () => {
        expect(() => createPprRequest({ ...validInput, firstname: '   ' }, NOW))
          .toThrow('Missing required fields')
      })
    })

    describe('email validation', () => {
      it('throws on invalid email', () => {
        expect(() => createPprRequest({ ...validInput, email: 'notanemail' }, NOW))
          .toThrow('Invalid email format')
      })

      it('accepts valid email formats', () => {
        const result = createPprRequest({ ...validInput, email: 'user@sub.domain.ch' }, NOW)
        expect(result.email).toBe('user@sub.domain.ch')
      })
    })

    describe('date validation', () => {
      it('throws on invalid date format', () => {
        expect(() => createPprRequest({ ...validInput, plannedDate: '15.04.2026' }, NOW))
          .toThrow('Invalid date format')
      })

      it('throws on past date', () => {
        expect(() => createPprRequest({ ...validInput, plannedDate: '2026-03-01' }, NOW))
          .toThrow('plannedDate must be today or in the future')
      })

      it('accepts today', () => {
        const result = createPprRequest({ ...validInput, plannedDate: '2026-04-01' }, NOW)
        expect(result.plannedDate).toBe('2026-04-01')
      })

      it('accepts future date', () => {
        const result = createPprRequest({ ...validInput, plannedDate: '2026-12-31' }, NOW)
        expect(result.plannedDate).toBe('2026-12-31')
      })
    })

    describe('time validation', () => {
      it('throws on invalid time format', () => {
        expect(() => createPprRequest({ ...validInput, plannedTime: '1030' }, NOW))
          .toThrow('Invalid time format')
      })

      it('throws on invalid hour', () => {
        expect(() => createPprRequest({ ...validInput, plannedTime: '25:00' }, NOW))
          .toThrow('Invalid time value')
      })

      it('throws on invalid minutes', () => {
        expect(() => createPprRequest({ ...validInput, plannedTime: '10:60' }, NOW))
          .toThrow('Invalid time value')
      })

      it('accepts valid times', () => {
        expect(createPprRequest({ ...validInput, plannedTime: '00:00' }, NOW).plannedTime).toBe('00:00')
        expect(createPprRequest({ ...validInput, plannedTime: '23:59' }, NOW).plannedTime).toBe('23:59')
      })
    })

    describe('mtow validation', () => {
      it('throws on negative mtow', () => {
        expect(() => createPprRequest({ ...validInput, mtow: -1 }, NOW))
          .toThrow('Invalid mtow value')
      })

      it('throws on non-numeric mtow', () => {
        expect(() => createPprRequest({ ...validInput, mtow: 'heavy' }, NOW))
          .toThrow('Invalid mtow value')
      })

      it('accepts zero mtow', () => {
        expect(createPprRequest({ ...validInput, mtow: 0 }, NOW).mtow).toBe(0)
      })

      it('converts string mtow to number', () => {
        expect(createPprRequest({ ...validInput, mtow: '1200' }, NOW).mtow).toBe(1200)
      })
    })

    describe('input sanitization', () => {
      it('strips HTML from string fields', () => {
        const result = createPprRequest({
          ...validInput,
          firstname: '<script>alert("xss")</script>Max',
          remarks: 'Flight <b>important</b>'
        }, NOW)
        expect(result.firstname).toBe('alert("xss")Max')
        expect(result.remarks).toBe('Flight important')
      })

      it('truncates fields exceeding max length', () => {
        const longName = 'A'.repeat(200)
        const result = createPprRequest({ ...validInput, firstname: longName }, NOW)
        expect(result.firstname.length).toBe(MAX_LENGTHS.firstname)
      })

      it('truncates remarks at 500 chars', () => {
        const longRemarks = 'X'.repeat(600)
        const result = createPprRequest({ ...validInput, remarks: longRemarks }, NOW)
        expect(result.remarks.length).toBe(MAX_LENGTHS.remarks)
      })

      it('truncates immatriculation at 10 chars', () => {
        const result = createPprRequest({
          ...validInput,
          immatriculation: 'HB-ABCDEFGHIJK'
        }, NOW)
        expect(result.immatriculation.length).toBe(MAX_LENGTHS.immatriculation)
      })
    })
  })

  describe('stripHtml', () => {
    it('removes HTML tags', () => {
      expect(stripHtml('<p>Hello</p>')).toBe('Hello')
    })

    it('handles nested tags', () => {
      expect(stripHtml('<div><span>Text</span></div>')).toBe('Text')
    })

    it('returns empty string for non-string input', () => {
      expect(stripHtml(null)).toBe('')
      expect(stripHtml(undefined)).toBe('')
      expect(stripHtml(123)).toBe('')
    })

    it('trims whitespace', () => {
      expect(stripHtml('  hello  ')).toBe('hello')
    })
  })

  describe('sanitizeReviewRemarks', () => {
    it('strips HTML and truncates', () => {
      const html = '<b>Rejected</b> because ' + 'X'.repeat(600)
      const result = sanitizeReviewRemarks(html)
      expect(result).not.toContain('<b>')
      expect(result.length).toBe(MAX_LENGTHS.reviewRemarks)
    })
  })

  describe('validateStatusTransition', () => {
    it('allows pending to approved', () => {
      expect(() => validateStatusTransition(Status.PENDING, Status.APPROVED))
        .not.toThrow()
    })

    it('allows pending to rejected', () => {
      expect(() => validateStatusTransition(Status.PENDING, Status.REJECTED))
        .not.toThrow()
    })

    it('rejects transition from approved', () => {
      expect(() => validateStatusTransition(Status.APPROVED, Status.REJECTED))
        .toThrow('Can only review requests with pending status')
    })

    it('rejects transition from rejected', () => {
      expect(() => validateStatusTransition(Status.REJECTED, Status.APPROVED))
        .toThrow('Can only review requests with pending status')
    })

    it('rejects invalid target status', () => {
      expect(() => validateStatusTransition(Status.PENDING, 'cancelled'))
        .toThrow('New status must be approved or rejected')
    })

    it('rejects transition to pending', () => {
      expect(() => validateStatusTransition(Status.PENDING, Status.PENDING))
        .toThrow('New status must be approved or rejected')
    })
  })

  describe('Status constants', () => {
    it('has expected values', () => {
      expect(Status.PENDING).toBe('pending')
      expect(Status.APPROVED).toBe('approved')
      expect(Status.REJECTED).toBe('rejected')
    })
  })
})
