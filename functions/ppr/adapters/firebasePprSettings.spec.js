'use strict'

const mockOnce = jest.fn()
const mockSet = jest.fn()
const mockRef = jest.fn(() => ({ once: mockOnce, set: mockSet }))

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

  it('writes the admin email', async () => {
    await settings.setAdminEmail('ppr@aerodrome.ch')

    expect(mockRef).toHaveBeenCalledWith('/settings/ppr/adminEmail')
    expect(mockSet).toHaveBeenCalledWith('ppr@aerodrome.ch')
  })

  it('removes the admin email with null', async () => {
    await settings.setAdminEmail(null)

    expect(mockSet).toHaveBeenCalledWith(null)
  })

  it('reads the stored retention as it is', async () => {
    mockOnce.mockResolvedValue({ val: () => 90 })

    expect(await settings.getRetentionDays()).toBe(90)
    expect(mockRef).toHaveBeenCalledWith('/settings/ppr/retentionDays')
  })

  it('writes or removes the retention', async () => {
    await settings.setRetentionDays(90)
    await settings.setRetentionDays(null)

    expect(mockSet.mock.calls).toEqual([[90], [null]])
  })

  describe('answer settings', () => {
    it('reads answer mode, information for pilots and closures with one read of /settings/ppr', async () => {
      const closures = [{ from: '2026-11-19', to: '2026-11-21', reason: 'Runway works' }]
      mockOnce.mockResolvedValue({
        val: () => ({ adminEmail: 'ppr@aerodrome.ch', answerMode: 'automatic', pilotInfo: 'Runway 05/23', closures })
      })

      expect(await settings.getAnswerSettings()).toEqual({ answerMode: 'automatic', pilotInfo: 'Runway 05/23', closures })
      expect(mockRef).toHaveBeenCalledTimes(1)
      expect(mockRef).toHaveBeenCalledWith('/settings/ppr')
    })

    it('reads nulls when nothing is set', async () => {
      mockOnce.mockResolvedValue({ val: () => null })

      expect(await settings.getAnswerSettings()).toEqual({ answerMode: null, pilotInfo: null, closures: null })
    })

    it('stores automatic answers, and manual (the default) as nothing', async () => {
      await settings.setAnswerMode('automatic')
      expect(mockRef).toHaveBeenLastCalledWith('/settings/ppr/answerMode')
      expect(mockSet).toHaveBeenLastCalledWith('automatic')

      await settings.setAnswerMode('manual')
      expect(mockSet).toHaveBeenLastCalledWith(null)
    })

    it('writes and removes the information for pilots', async () => {
      await settings.setPilotInfo('Runway 05/23')
      expect(mockRef).toHaveBeenLastCalledWith('/settings/ppr/pilotInfo')
      expect(mockSet).toHaveBeenLastCalledWith('Runway 05/23')

      await settings.setPilotInfo(null)
      expect(mockSet).toHaveBeenLastCalledWith(null)
    })

    it('writes the closures, and removes them with an empty list', async () => {
      const closures = [{ from: '2026-11-19', to: '2026-11-21', reason: 'Runway works' }]
      await settings.setClosures(closures)
      expect(mockRef).toHaveBeenLastCalledWith('/settings/ppr/closures')
      expect(mockSet).toHaveBeenLastCalledWith(closures)

      await settings.setClosures([])
      expect(mockSet).toHaveBeenLastCalledWith(null)
    })
  })
})
