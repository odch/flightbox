'use strict'

const mockChild = jest.fn()
const mockOnce = jest.fn()
const mockUpdate = jest.fn()

jest.mock('firebase-admin/database', () => ({
  getDatabase: jest.fn(() => ({
    ref: jest.fn(() => ({ child: mockChild, once: mockOnce, update: mockUpdate }))
  }))
}))

const { acquire, release, pruneExpired, WINDOW_MS, MAX_PER_WINDOW } = require('./firebaseRateLimiter')

const NOW = Date.UTC(2026, 10, 12, 10, 0)

// A node whose transactions behave like RTDB's: the update function may
// first get null, then the stored value; returning undefined aborts.
function storedValue(initial) {
  const node = { value: initial }
  node.transaction = jest.fn(async updateFn => {
    let result = updateFn(null)
    if (node.value !== null) {
      result = updateFn(node.value)
    }
    if (result === undefined) {
      return { committed: false, snapshot: { val: () => node.value } }
    }
    node.value = result
    return { committed: true, snapshot: { val: () => result } }
  })
  return node
}

describe('firebaseRateLimiter', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('acquire', () => {
    it('starts a window with the first submission', async () => {
      const node = storedValue(null)
      mockChild.mockReturnValue(node)

      expect(await acquire('uid-1', NOW)).toBe(true)
      expect(node.value).toEqual({ windowStart: NOW, count: 1 })
      expect(mockChild).toHaveBeenCalledWith('uid-1')
    })

    it('counts submissions within the window up to the limit', async () => {
      const node = storedValue({ windowStart: NOW - 1000, count: MAX_PER_WINDOW - 1 })
      mockChild.mockReturnValue(node)

      expect(await acquire('uid-1', NOW)).toBe(true)
      expect(node.value.count).toBe(MAX_PER_WINDOW)
      expect(await acquire('uid-1', NOW)).toBe(false)
      expect(node.value.count).toBe(MAX_PER_WINDOW)
    })

    it('starts a new window once the hour has passed', async () => {
      const node = storedValue({ windowStart: NOW - WINDOW_MS, count: MAX_PER_WINDOW })
      mockChild.mockReturnValue(node)

      expect(await acquire('uid-1', NOW)).toBe(true)
      expect(node.value).toEqual({ windowStart: NOW, count: 1 })
    })

    it('escapes characters that database keys cannot hold', async () => {
      mockChild.mockReturnValue(storedValue(null))

      await acquire('a.b/c#d', NOW)

      expect(mockChild).toHaveBeenCalledWith('a%2Eb%2Fc%23d')
    })
  })

  describe('release', () => {
    it('gives a reserved slot back', async () => {
      const node = storedValue({ windowStart: NOW, count: 3 })
      mockChild.mockReturnValue(node)

      await release('uid-1')

      expect(node.value).toEqual({ windowStart: NOW, count: 2 })
    })

    it('leaves a missing or empty entry alone', async () => {
      const empty = storedValue({ windowStart: NOW, count: 0 })
      mockChild.mockReturnValue(empty)
      await release('uid-1')
      expect(empty.value).toEqual({ windowStart: NOW, count: 0 })

      const missing = storedValue(null)
      mockChild.mockReturnValue(missing)
      await release('uid-2')
      expect(missing.value).toBeNull()
    })
  })

  describe('pruneExpired', () => {
    it('deletes entries whose window has passed', async () => {
      const entries = [
        { key: 'old', val: () => ({ windowStart: NOW - WINDOW_MS, count: 4 }) },
        { key: 'current', val: () => ({ windowStart: NOW - 1000, count: 1 }) }
      ]
      mockOnce.mockResolvedValue({ forEach: cb => entries.forEach(cb) })

      expect(await pruneExpired(NOW)).toBe(1)
      expect(mockUpdate).toHaveBeenCalledWith({ old: null })
    })

    it('writes nothing when no entry has expired', async () => {
      mockOnce.mockResolvedValue({ forEach: () => undefined })

      expect(await pruneExpired(NOW)).toBe(0)
      expect(mockUpdate).not.toHaveBeenCalled()
    })
  })
})
