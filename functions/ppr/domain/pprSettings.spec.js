'use strict'

const {
  normalizeAdminEmail,
  normalizeRetentionDays,
  isValidRetentionDays,
  normalizeAnswerMode,
  answerModeFromStore,
  normalizePilotInfo,
  pilotInfoFromStore,
  normalizeClosures,
  closuresFromStore,
  MAX_RETENTION_DAYS,
  MAX_PILOT_INFO_LENGTH,
  MAX_CLOSURES,
  MAX_CLOSURE_REASON_LENGTH
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

  describe('answer mode', () => {
    it.each(['manual', 'automatic'])('accepts %p', mode => {
      expect(normalizeAnswerMode(mode)).toBe(mode)
    })

    it.each([undefined, null, ''])('goes back to manual answers for %p', value => {
      expect(normalizeAnswerMode(value)).toBe('manual')
    })

    it.each(['auto', 'AUTOMATIC', true, 1])('rejects %p as invalid input', value => {
      expect(() => normalizeAnswerMode(value)).toThrow(expect.objectContaining({ code: 'INVALID_INPUT' }))
    })

    it('reads anything but a stored automatic as manual', () => {
      expect(answerModeFromStore('automatic')).toBe('automatic')
      expect(answerModeFromStore('manual')).toBe('manual')
      expect(answerModeFromStore(null)).toBe('manual')
      expect(answerModeFromStore('approve-all')).toBe('manual')
    })
  })

  describe('information for pilots', () => {
    it('keeps the text, trimmed', () => {
      expect(normalizePilotInfo('  Runway 05/23\nLanding fee CHF 20  ')).toBe('Runway 05/23\nLanding fee CHF 20')
    })

    it.each([undefined, null, '', '   '])('removes it for %p', value => {
      expect(normalizePilotInfo(value)).toBeNull()
    })

    it('rejects a text that is too long or not a text', () => {
      expect(() => normalizePilotInfo('x'.repeat(MAX_PILOT_INFO_LENGTH + 1)))
        .toThrow(expect.objectContaining({ code: 'INVALID_INPUT' }))
      expect(() => normalizePilotInfo(42)).toThrow(expect.objectContaining({ code: 'INVALID_INPUT' }))
    })

    it('reads a stored text, or null', () => {
      expect(pilotInfoFromStore(' Hi ')).toBe('Hi')
      expect(pilotInfoFromStore('')).toBeNull()
      expect(pilotInfoFromStore(42)).toBeNull()
    })
  })

  describe('closures', () => {
    const closure = { from: '2026-11-19', to: '2026-11-21', reason: ' Runway works ' }

    it('keeps valid closures, trimmed and sorted by start', () => {
      const christmas = { from: '2026-12-24', to: '2026-12-24', reason: 'Christmas' }
      expect(normalizeClosures([christmas, closure])).toEqual([
        { from: '2026-11-19', to: '2026-11-21', reason: 'Runway works' },
        christmas
      ])
    })

    it.each([undefined, null])('has none for %p', value => {
      expect(normalizeClosures(value)).toEqual([])
    })

    it.each([
      ['not a list', 'closures'],
      ['an invalid start', [{ ...closure, from: '2026-11-31' }]],
      ['a missing end', [{ from: '2026-11-19', reason: 'x' }]],
      ['an end before the start', [{ ...closure, to: '2026-11-18' }]],
      ['no reason', [{ ...closure, reason: '  ' }]],
      ['a reason that is too long', [{ ...closure, reason: 'x'.repeat(MAX_CLOSURE_REASON_LENGTH + 1) }]],
      ['too many closures', Array.from({ length: MAX_CLOSURES + 1 }, () => closure)],
    ])('rejects %s as invalid input', (_, value) => {
      expect(() => normalizeClosures(value)).toThrow(expect.objectContaining({ code: 'INVALID_INPUT' }))
    })

    it('reads stored closures, also from an object, and leaves out invalid ones', () => {
      const stored = {
        0: { from: '2026-12-24', to: '2026-12-24', reason: 'Christmas' },
        1: { from: '2026-11-19', to: '2026-11-21', reason: 'Runway works' },
        2: { from: 'soon', to: 'later', reason: 'broken' }
      }
      expect(closuresFromStore(stored)).toEqual([stored[1], stored[0]])
      expect(closuresFromStore(null)).toEqual([])
    })
  })
})
