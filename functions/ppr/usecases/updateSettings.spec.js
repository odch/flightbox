'use strict'

const updateSettings = require('./updateSettings')

function createSettings(stored = {}) {
  const values = {
    adminEmail: null, retentionDays: null, answerMode: null, pilotInfo: null, closures: null, manualAnswers: null, ...stored
  }
  return {
    getAdminEmail: jest.fn(async () => values.adminEmail),
    getRetentionDays: jest.fn(async () => values.retentionDays),
    getAnswerSettings: jest.fn(async () => ({
      answerMode: values.answerMode, pilotInfo: values.pilotInfo, closures: values.closures, manualAnswers: values.manualAnswers
    })),
    saveSettings: jest.fn(async changes => { Object.assign(values, changes) })
  }
}

// What the one write saved
const saved = settings => {
  expect(settings.saveSettings).toHaveBeenCalledTimes(1)
  return settings.saveSettings.mock.calls[0][0]
}

const DEFAULT_ANSWERS = {
  answerMode: 'manual', pilotInfo: null, closures: [], manualAnswers: { helicopters: false, mtowFrom: null }
}

describe('updateSettings', () => {
  it('saves the trimmed admin email and returns all settings', async () => {
    const settings = createSettings({ retentionDays: 60 })

    const result = await updateSettings({ settings }, { adminEmail: ' ppr@aerodrome.ch ' })

    expect(saved(settings)).toEqual({ adminEmail: 'ppr@aerodrome.ch' })
    expect(result).toEqual({ adminEmail: 'ppr@aerodrome.ch', retentionDays: 60, ...DEFAULT_ANSWERS })
  })

  it('removes the admin email for an empty value', async () => {
    const settings = createSettings({ adminEmail: 'old@aerodrome.ch' })

    const result = await updateSettings({ settings }, { adminEmail: '' })

    expect(saved(settings)).toEqual({ adminEmail: null })
    expect(result.adminEmail).toBeNull()
  })

  it('saves the retention without touching the admin email', async () => {
    const settings = createSettings({ adminEmail: 'ppr@aerodrome.ch' })

    const result = await updateSettings({ settings }, { retentionDays: 90 })

    expect(saved(settings)).toEqual({ retentionDays: 90 })
    expect(result).toEqual({ adminEmail: 'ppr@aerodrome.ch', retentionDays: 90, ...DEFAULT_ANSWERS })
  })

  it('goes back to the default retention for an empty value', async () => {
    const settings = createSettings({ retentionDays: 90 })

    const result = await updateSettings({ settings }, { retentionDays: null })

    expect(saved(settings)).toEqual({ retentionDays: null })
    expect(result.retentionDays).toBeNull()
  })

  it('rejects an invalid address without saving', async () => {
    const settings = createSettings()

    await expect(updateSettings({ settings }, { adminEmail: 'nope' }))
      .rejects.toThrow(expect.objectContaining({ code: 'INVALID_INPUT' }))
    expect(settings.saveSettings).not.toHaveBeenCalled()
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

    expect(saved(settings)).toEqual({
      answerMode: 'automatic',
      pilotInfo: 'Runway 05/23',
      closures: [{ ...works, reason: 'Runway works' }, christmas]
    })
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

    expect(saved(settings)).toEqual({ answerMode: 'manual', pilotInfo: null, closures: [] })
    expect(result).toEqual(expect.objectContaining(DEFAULT_ANSWERS))
  })

  it('writes nothing when a closure is invalid', async () => {
    const settings = createSettings()

    await expect(updateSettings({ settings }, {
      answerMode: 'automatic',
      closures: [{ from: '2026-11-21', to: '2026-11-19', reason: 'x' }]
    })).rejects.toThrow(expect.objectContaining({ code: 'INVALID_INPUT' }))
    expect(settings.saveSettings).not.toHaveBeenCalled()
  })

  it('saves the manual answers and returns them', async () => {
    const settings = createSettings({ answerMode: 'automatic' })

    const result = await updateSettings({ settings }, { manualAnswers: { helicopters: true, mtowFrom: 2250 } })

    expect(saved(settings)).toEqual({ manualAnswers: { helicopters: true, mtowFrom: 2250 } })
    expect(result.manualAnswers).toEqual({ helicopters: true, mtowFrom: 2250 })
  })

  it('switches the manual answers off for an empty value', async () => {
    const settings = createSettings({ manualAnswers: { helicopters: true, mtowFrom: 2250 } })

    const result = await updateSettings({ settings }, { manualAnswers: null })

    expect(saved(settings)).toEqual({ manualAnswers: { helicopters: false, mtowFrom: null } })
    expect(result.manualAnswers).toEqual({ helicopters: false, mtowFrom: null })
  })

  it('writes nothing when the manual answers are invalid', async () => {
    const settings = createSettings()

    await expect(updateSettings({ settings }, { answerMode: 'automatic', manualAnswers: { mtowFrom: 2250.5 } }))
      .rejects.toThrow(expect.objectContaining({ code: 'INVALID_INPUT' }))
    expect(settings.saveSettings).not.toHaveBeenCalled()
  })

  it('writes nothing when one of the values is invalid', async () => {
    const settings = createSettings()

    await expect(updateSettings({ settings }, { adminEmail: 'ppr@aerodrome.ch', retentionDays: 99999 }))
      .rejects.toThrow('retentionDays must be a whole number from 1 to 3650')
    expect(settings.saveSettings).not.toHaveBeenCalled()
  })

  // A submission between two writes, or a failed second one, would answer
  // automatically without the exceptions
  it('saves automatic answers and the aircraft an admin answers in one write', async () => {
    const settings = createSettings()

    await updateSettings({ settings }, {
      answerMode: 'automatic', pilotInfo: 'Runway 05/23', manualAnswers: { helicopters: true }
    })

    expect(saved(settings)).toEqual({
      answerMode: 'automatic', pilotInfo: 'Runway 05/23', manualAnswers: { helicopters: true, mtowFrom: null }
    })
  })

  it('writes nothing for no settings', async () => {
    const settings = createSettings({ adminEmail: 'ppr@aerodrome.ch' })

    const result = await updateSettings({ settings }, {})

    expect(settings.saveSettings).not.toHaveBeenCalled()
    expect(result.adminEmail).toBe('ppr@aerodrome.ch')
  })
})
