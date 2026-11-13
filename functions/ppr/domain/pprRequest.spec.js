'use strict'

const {
  Status,
  MAX_LENGTHS,
  createPprRequest,
  sanitizeReviewRemarks,
  validateReviewStatus,
  canBeReviewed,
  canBeRevoked,
  canBeDeletedBy,
  isValidDate,
  sanitizeString,
  zurichDate,
  addDays,
  MAX_DAYS_AHEAD
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
        language: 'de',
        createdBy: 'max@example.com',
        createdAt: NOW,
        negativeTimestamp: -NOW
      })
    })

    it('stores the pilot\'s language for the emails', () => {
      const result = createPprRequest({ ...validInput, language: 'en' }, NOW)
      expect(result.language).toBe('en')
    })

    it.each([undefined, '', 'fr', 'EN', 42])('falls back to German for language %p', language => {
      const result = createPprRequest({ ...validInput, language }, NOW)
      expect(result.language).toBe('de')
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

      // 00:30 on 13 Nov in Zurich is still 12 Nov in UTC, where functions run
      const ZURICH_AFTER_MIDNIGHT = Date.UTC(2026, 10, 12, 23, 30)

      it('uses the Zurich date for today, not the server\'s', () => {
        expect(() => createPprRequest({ ...validInput, plannedDate: '2026-11-12' }, ZURICH_AFTER_MIDNIGHT))
          .toThrow('plannedDate must be today or in the future')
        const result = createPprRequest({ ...validInput, plannedDate: '2026-11-13' }, ZURICH_AFTER_MIDNIGHT)
        expect(result.plannedDate).toBe('2026-11-13')
      })

      it.each(['2027-02-31', '2027-04-31', '2028-02-30', '2027-13-01'])('rejects the impossible date %s', date => {
        expect(() => createPprRequest({ ...validInput, plannedDate: date }, NOW)).toThrow('Invalid date')
      })

      it('accepts dates up to the maximum days ahead', () => {
        const last = addDays('2026-04-01', MAX_DAYS_AHEAD)
        expect(createPprRequest({ ...validInput, plannedDate: last }, NOW).plannedDate).toBe(last)
      })

      it('rejects dates beyond the maximum days ahead', () => {
        const tooFar = addDays('2026-04-01', MAX_DAYS_AHEAD + 1)
        expect(() => createPprRequest({ ...validInput, plannedDate: tooFar }, NOW))
          .toThrow(`plannedDate must be within ${MAX_DAYS_AHEAD} days`)
        expect(() => createPprRequest({ ...validInput, plannedDate: '9999-12-31' }, NOW))
          .toThrow(`plannedDate must be within ${MAX_DAYS_AHEAD} days`)
      })
    })

    describe('types', () => {
      it.each(['firstname', 'immatriculation', 'plannedDate', 'plannedTime', 'remarks'])(
        'rejects a non-text %s as invalid input', field => {
          let error
          try {
            createPprRequest({ ...validInput, [field]: 20990415 }, NOW)
          } catch (e) {
            error = e
          }
          expect(error.message).toBe(`Invalid fields: ${field}`)
          expect(error.code).toBe('INVALID_INPUT')
        }
      )

      it('marks every validation error as invalid input', () => {
        const attempts = [
          { ...validInput, firstname: '' },
          { ...validInput, email: 'nope' },
          { ...validInput, plannedDate: '15.04.2026' },
          { ...validInput, plannedTime: '25:00' },
          { ...validInput, mtow: -1 }
        ]
        attempts.forEach(input => {
          expect(() => createPprRequest(input, NOW)).toThrow(expect.objectContaining({ code: 'INVALID_INPUT' }))
        })
      })

      it('treats an empty mtow as not given', () => {
        expect(createPprRequest({ ...validInput, mtow: '' }, NOW).mtow).toBeUndefined()
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
      it('keeps text as entered (outputs are escaped), only trimmed', () => {
        const result = createPprRequest({
          ...validInput,
          firstname: '  Max  ',
          remarks: ' Nur Flugzeuge < 2t, Ankunft > 14:00 LT '
        }, NOW)
        expect(result.firstname).toBe('Max')
        expect(result.remarks).toBe('Nur Flugzeuge < 2t, Ankunft > 14:00 LT')
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

  describe('sanitizeString', () => {
    it('trims and limits the length', () => {
      expect(sanitizeString('  hello  ', 'firstname')).toBe('hello')
      expect(sanitizeString('X'.repeat(200), 'firstname').length).toBe(MAX_LENGTHS.firstname)
    })

    it('returns empty string for non-string input', () => {
      expect(sanitizeString(null, 'firstname')).toBe('')
      expect(sanitizeString(undefined, 'firstname')).toBe('')
      expect(sanitizeString(123, 'firstname')).toBe('')
    })
  })

  describe('sanitizeReviewRemarks', () => {
    it('keeps the remarks as entered and limits the length', () => {
      const remarks = 'Nur Flugzeuge < 2t, Ankunft > 14:00 LT ' + 'X'.repeat(600)
      const result = sanitizeReviewRemarks(remarks)
      expect(result.startsWith('Nur Flugzeuge < 2t, Ankunft > 14:00 LT')).toBe(true)
      expect(result.length).toBe(MAX_LENGTHS.reviewRemarks)
    })
  })

  describe('zurichDate / addDays', () => {
    it('gives the Zurich calendar date in summer and winter', () => {
      expect(zurichDate(Date.UTC(2026, 10, 12, 22, 59))).toBe('2026-11-12')
      expect(zurichDate(Date.UTC(2026, 10, 12, 23, 0))).toBe('2026-11-13')
      expect(zurichDate(Date.UTC(2026, 5, 30, 21, 59))).toBe('2026-06-30')
      expect(zurichDate(Date.UTC(2026, 5, 30, 22, 0))).toBe('2026-07-01')
    })

    it('adds calendar days across months and years', () => {
      expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
      expect(addDays('2028-03-01', -1)).toBe('2028-02-29')
    })
  })

  describe('validateReviewStatus', () => {
    it.each([Status.APPROVED, Status.REJECTED])('accepts %s', status => {
      expect(() => validateReviewStatus(status)).not.toThrow()
    })

    it.each(['cancelled', Status.PENDING, undefined])('rejects %p', status => {
      expect(() => validateReviewStatus(status)).toThrow('New status must be approved or rejected')
    })
  })

  describe('canBeReviewed', () => {
    it('allows pending requests only', () => {
      expect(canBeReviewed({ status: Status.PENDING })).toBe(true)
      expect(canBeReviewed({ status: Status.APPROVED })).toBe(false)
      expect(canBeReviewed({ status: Status.REJECTED })).toBe(false)
      expect(canBeReviewed({ status: Status.REVOKED })).toBe(false)
    })
  })

  describe('canBeRevoked', () => {
    it('allows approved requests only: a rejection is final', () => {
      expect(canBeRevoked({ status: Status.APPROVED })).toBe(true)
      expect(canBeRevoked({ status: Status.PENDING })).toBe(false)
      expect(canBeRevoked({ status: Status.REJECTED })).toBe(false)
      expect(canBeRevoked({ status: Status.REVOKED })).toBe(false)
    })
  })

  describe('isValidDate', () => {
    it.each(['2026-11-13', '2028-02-29'])('accepts %p', value => {
      expect(isValidDate(value)).toBe(true)
    })

    it.each(['2026-02-30', '2026-13-01', '13.11.2026', '', null, 20261113])('rejects %p', value => {
      expect(isValidDate(value)).toBe(false)
    })
  })

  describe('canBeDeletedBy', () => {
    const request = { status: Status.PENDING, createdBy: 'max@example.com' }

    it('allows the creator to delete a pending request', () => {
      expect(canBeDeletedBy(request, 'max@example.com')).toBe(true)
    })

    it('refuses other users', () => {
      expect(canBeDeletedBy(request, 'other@example.com')).toBe(false)
    })

    it.each([Status.APPROVED, Status.REJECTED])('refuses %s requests', status => {
      expect(canBeDeletedBy({ ...request, status }, 'max@example.com')).toBe(false)
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
