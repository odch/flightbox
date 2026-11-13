'use strict'

const mockDb = { ref: jest.fn() }
jest.mock('firebase-admin/database', () => ({ getDatabase: jest.fn(() => mockDb) }))

const mockFetch = jest.fn()
jest.mock('../../api/fetchAerodromeStatus', () => mockFetch)

const aerodromeStatus = require('./firebaseAerodromeStatus')

describe('firebaseAerodromeStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('reads the latest status with the same query as the status API', async () => {
    mockFetch.mockResolvedValue({ status: 'closed', message: 'Thunderstorms', last_update_by: 'Admin' })

    expect(await aerodromeStatus.getCurrent()).toEqual({ status: 'closed', details: 'Thunderstorms' })
    expect(mockFetch).toHaveBeenCalledWith(mockDb)
  })

  it('has no details when the status has none', async () => {
    mockFetch.mockResolvedValue({ status: 'open', message: '' })

    expect(await aerodromeStatus.getCurrent()).toEqual({ status: 'open', details: null })
  })

  it('is null when no status was ever set', async () => {
    mockFetch.mockResolvedValue({})

    expect(await aerodromeStatus.getCurrent()).toBeNull()
  })
})
