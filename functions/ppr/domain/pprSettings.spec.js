'use strict'

const {
  normalizeAdminEmail,
  normalizeRetentionDays,
  retentionDaysOrDefault,
  DEFAULT_RETENTION_DAYS,
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

    it.each([undefined, null, ''])('goes back to the default for %p', value => {
      expect(normalizeRetentionDays(value)).toBeNull()
    })

    it.each([0, -5, 7.5, MAX_RETENTION_DAYS + 1, 999999999, '30'])('rejects %p as invalid input', value => {
      expect(() => normalizeRetentionDays(value)).toThrow(expect.objectContaining({ code: 'INVALID_INPUT' }))
    })
  })

  describe('retentionDaysOrDefault', () => {
    it('uses a valid stored value', () => {
      expect(retentionDaysOrDefault(90)).toBe(90)
    })

    it.each([null, 999999999, '30'])('falls back to the default for %p', stored => {
      expect(retentionDaysOrDefault(stored)).toBe(DEFAULT_RETENTION_DAYS)
    })
  })
})
