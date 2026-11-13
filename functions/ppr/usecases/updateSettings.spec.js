'use strict'

const updateSettings = require('./updateSettings')

function createSettings(stored = {}) {
  const values = { adminEmail: null, retentionDays: null, answerMode: null, pilotInfo: null, closures: null, ...stored }
  return {
    getAdminEmail: jest.fn(async () => values.adminEmail),
    getRetentionDays: jest.fn(async () => values.retentionDays),
    getAnswerSettings: jest.fn(async () => ({
      answerMode: values.answerMode, pilotInfo: values.pilotInfo, closures: values.closures
    })),
    setAdminEmail: jest.fn(async value => { values.adminEmail = value }),
    setRetentionDays: jest.fn(async value => { values.retentionDays = value }),
    setAnswerMode: jest.fn(async value => { values.answerMode = value }),
    setPilotInfo: jest.fn(async value => { values.pilotInfo = value }),
    setClosures: jest.fn(async value => { values.closures = value })
  }
}

const DEFAULT_ANSWERS = { answerMode: 'manual', pilotInfo: null, closures: [] }

describe('updateSettings', () => {
  it('saves the trimmed admin email and returns all settings', async () => {
    const settings = createSettings({ retentionDays: 60 })

    const result = await updateSettings({ settings }, { adminEmail: ' ppr@aerodrome.ch ' })

    expect(settings.setAdminEmail).toHaveBeenCalledWith('ppr@aerodrome.ch')
    expect(settings.setRetentionDays).not.toHaveBeenCalled()
    expect(result).toEqual({ adminEmail: 'ppr@aerodrome.ch', retentionDays: 60, ...DEFAULT_ANSWERS })
  })

  it('removes the admin email for an empty value', async () => {
    const settings = createSettings({ adminEmail: 'old@aerodrome.ch' })

    const result = await updateSettings({ settings }, { adminEmail: '' })

    expect(settings.setAdminEmail).toHaveBeenCalledWith(null)
    expect(result.adminEmail).toBeNull()
  })

  it('saves the retention without touching the admin email', async () => {
    const settings = createSettings({ adminEmail: 'ppr@aerodrome.ch' })

    const result = await updateSettings({ settings }, { retentionDays: 90 })

    expect(settings.setRetentionDays).toHaveBeenCalledWith(90)
    expect(settings.setAdminEmail).not.toHaveBeenCalled()
    expect(result).toEqual({ adminEmail: 'ppr@aerodrome.ch', retentionDays: 90, ...DEFAULT_ANSWERS })
  })

  it('goes back to the default retention for an empty value', async () => {
    const settings = createSettings({ retentionDays: 90 })

    const result = await updateSettings({ settings }, { retentionDays: null })

    expect(settings.setRetentionDays).toHaveBeenCalledWith(null)
    expect(result.retentionDays).toBeNull()
  })

  it('rejects an invalid address without saving', async () => {
    const settings = createSettings()

    await expect(updateSettings({ settings }, { adminEmail: 'nope' }))
      .rejects.toThrow(expect.objectContaining({ code: 'INVALID_INPUT' }))
    expect(settings.setAdminEmail).not.toHaveBeenCalled()
  })

  it('saves the answer settings, with the closures validated and sorted', async () => {
    const settings = createSettings({ adminEmail: 'ppr@aerodrome.ch' })
    const christmas = { from: '2026-12-24', to: '2026-12-24', reason: 'Christmas' }
    const works = { from: '2026-11-19', to: '2026-11-21', reason: ' Runway works ' }

    const result = await updateSettings({ settings }, {
      answerMode: 'automatic',
      pilotInfo: ' Runway 05/23 ',
      closures: [christmas, works]
    })

    expect(settings.setAnswerMode).toHaveBeenCalledWith('automatic')
    expect(settings.setPilotInfo).toHaveBeenCalledWith('Runway 05/23')
    expect(settings.setClosures).toHaveBeenCalledWith([{ ...works, reason: 'Runway works' }, christmas])
    expect(settings.setAdminEmail).not.toHaveBeenCalled()
    expect(result).toEqual(expect.objectContaining({
      adminEmail: 'ppr@aerodrome.ch',
      answerMode: 'automatic',
      pilotInfo: 'Runway 05/23',
      closures: [{ ...works, reason: 'Runway works' }, christmas]
    }))
  })

  it('goes back to manual answers and removes text and closures for empty values', async () => {
    const settings = createSettings({ answerMode: 'automatic', pilotInfo: 'x', closures: [{ from: '2026-12-24', to: '2026-12-24', reason: 'x' }] })

    const result = await updateSettings({ settings }, { answerMode: null, pilotInfo: '', closures: [] })

    expect(settings.setAnswerMode).toHaveBeenCalledWith('manual')
    expect(settings.setPilotInfo).toHaveBeenCalledWith(null)
    expect(settings.setClosures).toHaveBeenCalledWith([])
    expect(result).toEqual(expect.objectContaining(DEFAULT_ANSWERS))
  })

  it('writes nothing when a closure is invalid', async () => {
    const settings = createSettings()

    await expect(updateSettings({ settings }, {
      answerMode: 'automatic',
      closures: [{ from: '2026-11-21', to: '2026-11-19', reason: 'x' }]
    })).rejects.toThrow(expect.objectContaining({ code: 'INVALID_INPUT' }))
    expect(settings.setAnswerMode).not.toHaveBeenCalled()
    expect(settings.setClosures).not.toHaveBeenCalled()
  })

  it('writes nothing when one of the values is invalid', async () => {
    const settings = createSettings()

    await expect(updateSettings({ settings }, { adminEmail: 'ppr@aerodrome.ch', retentionDays: 99999 }))
      .rejects.toThrow('retentionDays must be a whole number from 1 to 3650')
    expect(settings.setAdminEmail).not.toHaveBeenCalled()
    expect(settings.setRetentionDays).not.toHaveBeenCalled()
  })
})
