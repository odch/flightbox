'use strict'

const {
  STATUS_TOKEN_PATTERN,
  statusTokenHashes,
  withStatusToken,
  withoutStatusTokens,
  toPublicStatus
} = require('./pprStatusLink')

const HASH_A = 'a'.repeat(64)
const HASH_B = 'b'.repeat(64)
const NOW = Date.UTC(2026, 10, 15, 9, 0)

const storedRequest = {
  key: 'req-1',
  status: 'pending',
  firstname: 'Max',
  lastname: 'Muster',
  email: 'max@example.com',
  phone: '+41 79 123 45 67',
  immatriculation: 'HB-ABC',
  aircraftType: 'PA-28',
  mtow: 1100,
  plannedDate: '2026-11-20',
  plannedTime: '10:30',
  flightType: 'private',
  remarks: 'Training',
  language: 'de',
  createdBy: 'max@example.com',
  createdAt: NOW,
  negativeTimestamp: -NOW,
  statusTokens: { [HASH_A]: NOW }
}

describe('pprStatusLink', () => {
  describe('STATUS_TOKEN_PATTERN', () => {
    it('matches 43 characters of base64url', () => {
      expect(STATUS_TOKEN_PATTERN.test('Ab9_-'.repeat(8) + 'xyz')).toBe(true)
    })

    it.each([
      ['42 characters', 'a'.repeat(42)],
      ['44 characters', 'a'.repeat(44)],
      ['base64 padding', 'a'.repeat(42) + '='],
      ['a slash', 'a'.repeat(42) + '/'],
      ['a plus', 'a'.repeat(42) + '+'],
      ['a dot', 'a'.repeat(42) + '.'],
      ['nothing', '']
    ])('does not match %s', (name, token) => {
      expect(STATUS_TOKEN_PATTERN.test(token)).toBe(false)
    })
  })

  describe('statusTokenHashes', () => {
    it('lists the stored hashes', () => {
      expect(statusTokenHashes({ statusTokens: { [HASH_A]: 1, [HASH_B]: 2 } })).toEqual([HASH_A, HASH_B])
    })

    it.each([undefined, null, 'abc', [HASH_A]])('has none for %p (e.g. requests made before the links)', statusTokens => {
      expect(statusTokenHashes({ statusTokens })).toEqual([])
    })
  })

  describe('withStatusToken', () => {
    it('adds a hash with the time it was issued, keeping the others', () => {
      expect(withStatusToken({ statusTokens: { [HASH_A]: 1 } }, HASH_B, NOW)).toEqual({ [HASH_A]: 1, [HASH_B]: NOW })
    })

    it('starts the hashes of a request without any', () => {
      expect(withStatusToken({}, HASH_A, NOW)).toEqual({ [HASH_A]: NOW })
      expect(withStatusToken({ statusTokens: 'broken' }, HASH_A, NOW)).toEqual({ [HASH_A]: NOW })
    })

    it('does not change the request', () => {
      const request = { statusTokens: { [HASH_A]: 1 } }
      withStatusToken(request, HASH_B, NOW)
      expect(request).toEqual({ statusTokens: { [HASH_A]: 1 } })
    })
  })

  describe('withoutStatusTokens', () => {
    it('leaves out the hashes and keeps everything else', () => {
      const { statusTokens, ...rest } = storedRequest
      expect(withoutStatusTokens(storedRequest)).toEqual(rest)
      expect(storedRequest.statusTokens).toEqual({ [HASH_A]: NOW })
    })
  })

  describe('toPublicStatus', () => {
    it('shows the flight and whether it can be withdrawn, and no personal data', () => {
      expect(toPublicStatus(storedRequest)).toStrictEqual({
        status: 'pending',
        immatriculation: 'HB-ABC',
        plannedDate: '2026-11-20',
        plannedTime: '10:30',
        flightType: 'private',
        automatic: false,
        canWithdraw: true
      })
    })

    it('shows the aerodrome\'s answer, but not who gave it', () => {
      const answered = { ...storedRequest, status: 'rejected', reviewedBy: 'admin@aero.ch', reviewedAt: NOW, reviewRemarks: 'Runway works' }
      expect(toPublicStatus(answered)).toStrictEqual({
        status: 'rejected',
        immatriculation: 'HB-ABC',
        plannedDate: '2026-11-20',
        plannedTime: '10:30',
        flightType: 'private',
        reviewRemarks: 'Runway works',
        automatic: false,
        canWithdraw: false
      })
    })

    it('tells an automatic answer', () => {
      const automatic = { ...storedRequest, status: 'approved', reviewedBy: 'automatic', reviewRemarks: 'Runway 05/23' }
      expect(toPublicStatus(automatic)).toMatchObject({ status: 'approved', automatic: true, canWithdraw: false })
    })
  })
})
