'use strict'

const getSettings = require('./getSettings')

function createSettings(adminEmail, retentionDays) {
  return {
    getAdminEmail: jest.fn().mockResolvedValue(adminEmail),
    getRetentionDays: jest.fn().mockResolvedValue(retentionDays)
  }
}

describe('getSettings', () => {
  it('returns the admin email and the retention', async () => {
    const settings = createSettings('ppr@aerodrome.ch', 60)

    expect(await getSettings({ settings })).toEqual({ adminEmail: 'ppr@aerodrome.ch', retentionDays: 60 })
  })

  it('returns null for settings that are not set', async () => {
    expect(await getSettings({ settings: createSettings(null, null) }))
      .toEqual({ adminEmail: null, retentionDays: null })
  })

  it.each([999999999, '30', 0])('reports the invalid stored retention %p as null (the default applies)', async stored => {
    const result = await getSettings({ settings: createSettings(null, stored) })
    expect(result.retentionDays).toBeNull()
  })
})
