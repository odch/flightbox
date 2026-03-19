'use strict'

const mockOnce = jest.fn()
const mockUpdate = jest.fn()
const mockRef = jest.fn(() => ({ once: mockOnce, update: mockUpdate }))

jest.mock('firebase-admin/database', () => ({
  getDatabase: jest.fn(() => ({ ref: mockRef }))
}))

jest.mock('firebase-functions/v2/scheduler', () => ({
  onSchedule: jest.fn((opts, fn) => fn)
}))

const mockPruneExpired = jest.fn()
jest.mock('./adapters/firebaseRateLimiter', () => ({ pruneExpired: mockPruneExpired }))

const { onSchedule } = require('firebase-functions/v2/scheduler')
const { cleanupExpiredPprRequests, getCutoffDate } = require('./cleanup')

// Captured at module load, before clearAllMocks resets the calls
const [scheduleOptions, scheduledHandler] = onSchedule.mock.calls[0]

describe('PPR cleanup', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('registers a daily job in europe-west1, Zurich time', () => {
    expect(scheduleOptions).toEqual({
      region: 'europe-west1',
      schedule: '0 2 * * *',
      timeZone: 'Europe/Zurich'
    })
  })

  it('also prunes expired rate-limit entries when it runs', async () => {
    mockRef.mockImplementation(path => {
      if (path === '/settings/ppr/retentionDays') {
        return { once: jest.fn().mockResolvedValue({ val: () => 30 }) }
      }
      return { once: jest.fn().mockResolvedValue({ exists: () => false }) }
    })

    await scheduledHandler()

    expect(mockPruneExpired).toHaveBeenCalledTimes(1)
  })

  describe('getCutoffDate', () => {
    it('returns the Zurich date N days ago', () => {
      // 00:30 on 13 Nov in Zurich, still 12 Nov in UTC
      expect(getCutoffDate(30, Date.UTC(2026, 10, 12, 23, 30))).toBe('2026-10-14')
      expect(getCutoffDate(1, Date.UTC(2026, 0, 1, 12, 0))).toBe('2025-12-31')
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

    it.each([999999999, 500000, 1e12, 3651, 7.5, -3, '30'])(
      'ignores the invalid retention %p and keeps future and recent requests', async retentionDays => {
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
        const children = [
          { key: 'past', val: () => ({ plannedDate: '2020-01-01' }) },
          { key: 'future', val: () => ({ plannedDate: '2099-12-31' }) }
        ]
        mockRef.mockImplementation(path => {
          if (path === '/settings/ppr/retentionDays') {
            return { once: jest.fn().mockResolvedValue({ val: () => retentionDays }) }
          }
          return {
            once: jest.fn().mockResolvedValue({
              exists: () => true,
              forEach: (cb) => children.forEach(cb)
            }),
            update: mockUpdate
          }
        })

        const count = await cleanupExpiredPprRequests()

        expect(count).toBe(1)
        expect(mockUpdate).toHaveBeenCalledWith({ past: null })
        expect(warn).toHaveBeenCalled()
        warn.mockRestore()
      }
    )

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
