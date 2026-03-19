'use strict'

const mockOnce = jest.fn()
const mockUpdate = jest.fn()
const mockRef = jest.fn(() => ({ once: mockOnce, update: mockUpdate }))

jest.mock('firebase-admin', () => ({
  database: jest.fn(() => ({ ref: mockRef }))
}))

jest.mock('firebase-functions', () => {
  const mock = {
    region: jest.fn(() => mock),
    pubsub: {
      schedule: jest.fn(() => ({
        timeZone: jest.fn(() => ({
          onRun: jest.fn()
        }))
      }))
    }
  }
  return mock
})

const { cleanupExpiredPprRequests, getCutoffDate } = require('./cleanup')

describe('PPR cleanup', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getCutoffDate', () => {
    it('returns a date string N days ago', () => {
      const result = getCutoffDate(30)
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)

      const cutoff = new Date(result + 'T00:00:00')
      const now = new Date()
      now.setHours(0, 0, 0, 0)
      const diffMs = now.getTime() - cutoff.getTime()
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
      expect(diffDays).toBe(30)
    })
  })

  describe('cleanupExpiredPprRequests', () => {
    it('deletes requests with plannedDate before cutoff', async () => {
      const pastDate = '2020-01-01'
      const futureDate = '2099-12-31'

      mockRef.mockImplementation(path => {
        if (path === '/settings/ppr/retentionDays') {
          return { once: jest.fn().mockResolvedValue({ val: () => 30 }) }
        }
        if (path === '/pprRequests') {
          const children = [
            { key: 'old-1', val: () => ({ plannedDate: pastDate }) },
            { key: 'recent-1', val: () => ({ plannedDate: futureDate }) }
          ]
          return {
            once: jest.fn().mockResolvedValue({
              exists: () => true,
              forEach: (cb) => children.forEach(cb)
            }),
            update: mockUpdate
          }
        }
        return { once: mockOnce, update: mockUpdate }
      })

      const count = await cleanupExpiredPprRequests()

      expect(count).toBe(1)
      expect(mockUpdate).toHaveBeenCalledWith({ 'old-1': null })
    })

    it('returns 0 when no requests exist', async () => {
      mockRef.mockImplementation(path => {
        if (path === '/settings/ppr/retentionDays') {
          return { once: jest.fn().mockResolvedValue({ val: () => 30 }) }
        }
        if (path === '/pprRequests') {
          return {
            once: jest.fn().mockResolvedValue({ exists: () => false })
          }
        }
        return { once: mockOnce }
      })

      const count = await cleanupExpiredPprRequests()
      expect(count).toBe(0)
    })

    it('returns 0 when all requests are recent', async () => {
      mockRef.mockImplementation(path => {
        if (path === '/settings/ppr/retentionDays') {
          return { once: jest.fn().mockResolvedValue({ val: () => 30 }) }
        }
        if (path === '/pprRequests') {
          const children = [
            { key: 'req-1', val: () => ({ plannedDate: '2099-12-31' }) }
          ]
          return {
            once: jest.fn().mockResolvedValue({
              exists: () => true,
              forEach: (cb) => children.forEach(cb)
            }),
            update: mockUpdate
          }
        }
        return { once: mockOnce }
      })

      const count = await cleanupExpiredPprRequests()
      expect(count).toBe(0)
      expect(mockUpdate).not.toHaveBeenCalled()
    })

    it('uses default retention when setting is missing', async () => {
      mockRef.mockImplementation(path => {
        if (path === '/settings/ppr/retentionDays') {
          return { once: jest.fn().mockResolvedValue({ val: () => null }) }
        }
        if (path === '/pprRequests') {
          return {
            once: jest.fn().mockResolvedValue({ exists: () => false })
          }
        }
        return { once: mockOnce }
      })

      const count = await cleanupExpiredPprRequests()
      expect(count).toBe(0)
    })

    it('deletes multiple expired requests in one update', async () => {
      mockRef.mockImplementation(path => {
        if (path === '/settings/ppr/retentionDays') {
          return { once: jest.fn().mockResolvedValue({ val: () => 30 }) }
        }
        if (path === '/pprRequests') {
          const children = [
            { key: 'old-1', val: () => ({ plannedDate: '2020-01-01' }) },
            { key: 'old-2', val: () => ({ plannedDate: '2020-06-15' }) },
            { key: 'old-3', val: () => ({ plannedDate: '2021-03-01' }) }
          ]
          return {
            once: jest.fn().mockResolvedValue({
              exists: () => true,
              forEach: (cb) => children.forEach(cb)
            }),
            update: mockUpdate
          }
        }
        return { once: mockOnce }
      })

      const count = await cleanupExpiredPprRequests()
      expect(count).toBe(3)
      expect(mockUpdate).toHaveBeenCalledWith({
        'old-1': null,
        'old-2': null,
        'old-3': null
      })
    })
  })
})
