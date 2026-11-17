'use strict'

const mockOnce = jest.fn()
const mockUpdate = jest.fn()
const mockRef = jest.fn(() => ({ once: mockOnce, update: mockUpdate }))

jest.mock('firebase-admin/database', () => ({
  getDatabase: jest.fn(() => ({ ref: mockRef }))
}))

const settings = require('./firebasePprSettings')

describe('firebasePprSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('reads the admin email from /settings/ppr/adminEmail', async () => {
    mockOnce.mockResolvedValue({ val: () => 'ppr@aerodrome.ch' })

    expect(await settings.getAdminEmail()).toBe('ppr@aerodrome.ch')
    expect(mockRef).toHaveBeenCalledWith('/settings/ppr/adminEmail')
  })

  it('returns null when no admin email is set', async () => {
    mockOnce.mockResolvedValue({ val: () => null })

    expect(await settings.getAdminEmail()).toBeNull()
  })

  it('reads the stored retention as it is', async () => {
    mockOnce.mockResolvedValue({ val: () => 90 })

    expect(await settings.getRetentionDays()).toBe(90)
    expect(mockRef).toHaveBeenCalledWith('/settings/ppr/retentionDays')
  })

  describe('answer settings', () => {
    it('reads answer mode, information for pilots, closures and manual answers with one read of /settings/ppr', async () => {
      const closures = [{ from: '2026-11-19', to: '2026-11-21', reason: 'Runway works' }]
      const manualAnswers = { helicopters: true, mtowFrom: 2250 }
      mockOnce.mockResolvedValue({
        val: () => ({ adminEmail: 'ppr@aerodrome.ch', answerMode: 'automatic', pilotInfo: 'Runway 05/23', closures, manualAnswers })
      })

      expect(await settings.getAnswerSettings())
        .toEqual({ answerMode: 'automatic', pilotInfo: 'Runway 05/23', closures, manualAnswers })
      expect(mockRef).toHaveBeenCalledTimes(1)
      expect(mockRef).toHaveBeenCalledWith('/settings/ppr')
    })

    it('reads nulls when nothing is set', async () => {
      mockOnce.mockResolvedValue({ val: () => null })

      expect(await settings.getAnswerSettings()).toEqual({ answerMode: null, pilotInfo: null, closures: null, manualAnswers: null })
    })
  })

  describe('saving', () => {
    it('writes the given settings in one update of /settings/ppr', async () => {
      const closures = [{ from: '2026-11-19', to: '2026-11-21', reason: 'Runway works' }]

      await settings.saveSettings({
        adminEmail: 'ppr@aerodrome.ch',
        retentionDays: 90,
        answerMode: 'automatic',
        pilotInfo: 'Runway 05/23',
        closures,
        manualAnswers: { helicopters: true, mtowFrom: 2250 }
      })

      expect(mockRef).toHaveBeenCalledTimes(1)
      expect(mockRef).toHaveBeenCalledWith('/settings/ppr')
      expect(mockUpdate).toHaveBeenCalledTimes(1)
      expect(mockUpdate).toHaveBeenCalledWith({
        adminEmail: 'ppr@aerodrome.ch',
        retentionDays: 90,
        answerMode: 'automatic',
        pilotInfo: 'Runway 05/23',
        closures,
        manualAnswers: { helicopters: true, mtowFrom: 2250 }
      })
    })

    it('removes empty settings, manual answers (the default) included', async () => {
      await settings.saveSettings({
        adminEmail: null,
        retentionDays: null,
        answerMode: 'manual',
        pilotInfo: null,
        closures: [],
        manualAnswers: { helicopters: false, mtowFrom: null }
      })

      expect(mockUpdate).toHaveBeenCalledWith({
        adminEmail: null, retentionDays: null, answerMode: null, pilotInfo: null, closures: null, manualAnswers: null
      })
    })

    it('keeps the manual answers while one of them is on', async () => {
      await settings.saveSettings({ manualAnswers: { helicopters: false, mtowFrom: 5700 } })

      expect(mockUpdate).toHaveBeenCalledWith({ manualAnswers: { helicopters: false, mtowFrom: 5700 } })
    })

    it('leaves the settings not given as they are, and writes nothing for none', async () => {
      await settings.saveSettings({ retentionDays: 30, unknown: 'x' })
      expect(mockUpdate).toHaveBeenLastCalledWith({ retentionDays: 30 })

      await settings.saveSettings({})
      expect(mockUpdate).toHaveBeenCalledTimes(1)
    })
  })
})
