'use strict'

const {
  normalizeAdminEmail,
  normalizeRetentionDays,
  isValidRetentionDays,
  MAX_RETENTION_DAYS
} = require('./pprSettings')

describe('pprSettings', () => {
  describe('normalizeAdminEmail', () => {
    it('keeps a valid address, trimmed', () => {
      expect(normalizeAdminEmail('  ppr@aerodrome.ch ')).toBe('ppr@aerodrome.ch')
    })

    it.each([undefined, null, '', '   '])('removes the address for %p', value => {
      expect(normalizeAdminEmail(value)).toBeNull()
    })

    it.each(['no-at-sign', 'a@b', 'two words@aerodrome.ch', `${'x'.repeat(250)}@aerodrome.ch`])(
      'rejects %p as invalid input', value => {
        expect(() => normalizeAdminEmail(value)).toThrow(expect.objectContaining({ code: 'INVALID_INPUT' }))
      }
    )

    it('rejects a non-text value', () => {
      expect(() => normalizeAdminEmail(42)).toThrow('Invalid adminEmail')
    })
  })

  describe('normalizeRetentionDays', () => {
    it.each([1, 30, MAX_RETENTION_DAYS])('accepts %p days', days => {
      expect(normalizeRetentionDays(days)).toBe(days)
    })

    it.each([undefined, null, ''])('removes the retention for %p', value => {
      expect(normalizeRetentionDays(value)).toBeNull()
    })

    it.each([0, -5, 7.5, MAX_RETENTION_DAYS + 1, 999999999, '30'])('rejects %p as invalid input', value => {
      expect(() => normalizeRetentionDays(value)).toThrow(expect.objectContaining({ code: 'INVALID_INPUT' }))
    })
  })

  describe('isValidRetentionDays', () => {
    it.each([1, 90, MAX_RETENTION_DAYS])('accepts %p', days => {
      expect(isValidRetentionDays(days)).toBe(true)
    })

    it.each([null, undefined, 0, 999999999, 7.5, '30'])('rejects %p', stored => {
      expect(isValidRetentionDays(stored)).toBe(false)
    })
  })
})
