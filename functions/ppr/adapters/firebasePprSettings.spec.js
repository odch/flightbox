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
})
