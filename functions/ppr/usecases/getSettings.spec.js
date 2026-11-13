'use strict'

const getSettings = require('./getSettings')

const NO_ANSWER_SETTINGS = { answerMode: null, pilotInfo: null, closures: null }

function createSettings(adminEmail, retentionDays, answerSettings = NO_ANSWER_SETTINGS) {
  return {
    getAdminEmail: jest.fn().mockResolvedValue(adminEmail),
    getRetentionDays: jest.fn().mockResolvedValue(retentionDays),
    getAnswerSettings: jest.fn().mockResolvedValue(answerSettings)
  }
}

describe('getSettings', () => {
  it('returns all settings', async () => {
    const closures = [{ from: '2026-11-19', to: '2026-11-21', reason: 'Runway works' }]
    const settings = createSettings('ppr@aerodrome.ch', 60, { answerMode: 'automatic', pilotInfo: 'Runway 05/23', closures })

    expect(await getSettings({ settings })).toEqual({
      adminEmail: 'ppr@aerodrome.ch',
      retentionDays: 60,
      answerMode: 'automatic',
      pilotInfo: 'Runway 05/23',
      closures
    })
  })

  it('returns the defaults for settings that are not set', async () => {
    expect(await getSettings({ settings: createSettings(null, null) })).toEqual({
      adminEmail: null,
      retentionDays: null,
      answerMode: 'manual',
      pilotInfo: null,
      closures: []
    })
  })

  it('reports invalid stored answer settings the way they are used', async () => {
    const result = await getSettings({
      settings: createSettings(null, null, { answerMode: 'yes', pilotInfo: 42, closures: { 0: { from: 'x' } } })
    })
    expect(result).toEqual(expect.objectContaining({ answerMode: 'manual', pilotInfo: null, closures: [] }))
  })

  it.each([999999999, '30', 0])('reports the invalid stored retention %p as null (the default applies)', async stored => {
    const result = await getSettings({ settings: createSettings(null, stored) })
    expect(result.retentionDays).toBeNull()
  })
})
