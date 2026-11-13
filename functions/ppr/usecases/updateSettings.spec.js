'use strict'

const updateSettings = require('./updateSettings')

function createSettings(stored = {}) {
  const values = { adminEmail: null, retentionDays: null, ...stored }
  return {
    getAdminEmail: jest.fn(async () => values.adminEmail),
    getRetentionDays: jest.fn(async () => values.retentionDays),
    setAdminEmail: jest.fn(async value => { values.adminEmail = value }),
    setRetentionDays: jest.fn(async value => { values.retentionDays = value })
  }
}

describe('updateSettings', () => {
  it('saves the trimmed admin email and returns all settings', async () => {
    const settings = createSettings({ retentionDays: 60 })

    const result = await updateSettings({ settings }, { adminEmail: ' ppr@aerodrome.ch ' })

    expect(settings.setAdminEmail).toHaveBeenCalledWith('ppr@aerodrome.ch')
    expect(settings.setRetentionDays).not.toHaveBeenCalled()
    expect(result).toEqual({ adminEmail: 'ppr@aerodrome.ch', retentionDays: 60 })
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
    expect(result).toEqual({ adminEmail: 'ppr@aerodrome.ch', retentionDays: 90 })
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

  it('writes nothing when one of the values is invalid', async () => {
    const settings = createSettings()

    await expect(updateSettings({ settings }, { adminEmail: 'ppr@aerodrome.ch', retentionDays: 99999 }))
      .rejects.toThrow('retentionDays must be a whole number from 1 to 3650')
    expect(settings.setAdminEmail).not.toHaveBeenCalled()
    expect(settings.setRetentionDays).not.toHaveBeenCalled()
  })
})
