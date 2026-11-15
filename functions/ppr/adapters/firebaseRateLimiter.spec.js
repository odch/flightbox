'use strict'

const crypto = require('crypto')

const mockChild = jest.fn()
const mockOnce = jest.fn()
const mockUpdate = jest.fn()
const mockRef = jest.fn(() => ({ child: mockChild, once: mockOnce, update: mockUpdate }))

jest.mock('firebase-admin/database', () => ({
  getDatabase: jest.fn(() => ({ ref: mockRef }))
}))

const {
  acquire,
  release,
  pruneExpired,
  guestClientLimiter,
  guestMailboxLimiter,
  guestMailboxDayLimiter,
  WINDOW_MS,
  DAY_WINDOW_MS,
  MAX_PER_WINDOW,
  GUEST_MAX_PER_CLIENT,
  GUEST_MAX_PER_MAILBOX,
  GUEST_MAX_PER_MAILBOX_PER_DAY
} = require('./firebaseRateLimiter')

const NOW = Date.UTC(2026, 10, 12, 10, 0)

const sha256 = value => crypto.createHash('sha256').update(value).digest('hex')

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
  node.once = jest.fn(async () => ({ val: () => node.value }))
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
      expect(mockRef).toHaveBeenCalledWith('/pprRateLimits')
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
      expect(mockRef).toHaveBeenCalledWith('/pprRateLimits')
      expect(mockUpdate).toHaveBeenCalledWith({ old: null })
    })

    it('writes nothing when no entry has expired', async () => {
      mockOnce.mockResolvedValue({ forEach: () => undefined })

      expect(await pruneExpired(NOW)).toBe(0)
      expect(mockUpdate).not.toHaveBeenCalled()
    })
  })

  describe('limits without login', () => {
    it('allow 10 submissions per client and 5 per mailbox an hour, and 10 per mailbox a day', () => {
      expect(GUEST_MAX_PER_CLIENT).toBe(10)
      expect(GUEST_MAX_PER_MAILBOX).toBe(5)
      expect(GUEST_MAX_PER_MAILBOX_PER_DAY).toBe(10)
      expect(DAY_WINDOW_MS).toBe(24 * WINDOW_MS)
    })

    it.each([
      ['client', GUEST_MAX_PER_CLIENT, guestClientLimiter, '/pprGuestRateLimits/client', '203.0.113.7'],
      ['mailbox', GUEST_MAX_PER_MAILBOX, guestMailboxLimiter, '/pprGuestRateLimits/mailbox', 'pilot@example.ch'],
      ['mailbox and day', GUEST_MAX_PER_MAILBOX_PER_DAY, guestMailboxDayLimiter, '/pprGuestRateLimits/mailboxDay',
        'pilot@example.ch']
    ])('per %s: count up to %i in the window', async (name, max, limiter, path, subject) => {
      const node = storedValue({ windowStart: NOW - 1000, count: max - 1 })
      mockChild.mockReturnValue(node)

      expect(await limiter.acquire(subject, NOW)).toBe(true)
      expect(await limiter.acquire(subject, NOW)).toBe(false)
      expect(node.value).toEqual({ windowStart: NOW - 1000, count: max })
      expect(mockRef).toHaveBeenCalledWith(path)
    })

    it.each([
      ['client', guestClientLimiter, '2001:db8:abcd:12::/64'],
      ['mailbox', guestMailboxLimiter, 'pilot@example.ch'],
      ['mailbox per day', guestMailboxDayLimiter, 'pilot@example.ch']
    ])('store the %s only as a hash', async (name, limiter, subject) => {
      mockChild.mockReturnValue(storedValue(null))

      await limiter.acquire(subject, NOW)
      await limiter.release(subject)
      await limiter.retryAfterMs(subject, NOW)

      expect(mockChild.mock.calls).toEqual([[sha256(subject)], [sha256(subject)], [sha256(subject)]])
    })

    it('give a slot back', async () => {
      const node = storedValue({ windowStart: NOW, count: 2 })
      mockChild.mockReturnValue(node)

      await guestMailboxLimiter.release('pilot@example.ch')

      expect(node.value).toEqual({ windowStart: NOW, count: 1 })
    })

    it('count a mailbox for a day', async () => {
      const node = storedValue({ windowStart: NOW - WINDOW_MS, count: GUEST_MAX_PER_MAILBOX_PER_DAY })
      mockChild.mockReturnValue(node)

      expect(await guestMailboxDayLimiter.acquire('pilot@example.ch', NOW)).toBe(false)
      expect(await guestMailboxDayLimiter.retryAfterMs('pilot@example.ch', NOW)).toBe(DAY_WINDOW_MS - WINDOW_MS)
      expect(await guestMailboxDayLimiter.acquire('pilot@example.ch', NOW - WINDOW_MS + DAY_WINDOW_MS)).toBe(true)
    })

    it('prune their own entries', async () => {
      const entries = [{ key: sha256('203.0.113.7'), val: () => ({ windowStart: NOW - WINDOW_MS, count: 10 }) }]
      mockOnce.mockResolvedValue({ forEach: cb => entries.forEach(cb) })

      expect(await guestClientLimiter.pruneExpired(NOW)).toBe(1)
      expect(mockRef).toHaveBeenCalledWith('/pprGuestRateLimits/client')
      expect(mockUpdate).toHaveBeenCalledWith({ [sha256('203.0.113.7')]: null })
    })
  })

  describe('retryAfterMs', () => {
    it('is the time until the running window ends', async () => {
      mockChild.mockReturnValue(storedValue({ windowStart: NOW - 1000, count: 5 }))

      expect(await guestMailboxLimiter.retryAfterMs('pilot@example.ch', NOW)).toBe(WINDOW_MS - 1000)
    })

    it.each([
      ['no entry', null],
      ['a window that has passed', { windowStart: NOW - WINDOW_MS, count: 5 }]
    ])('is 0 for %s', async (name, entry) => {
      mockChild.mockReturnValue(storedValue(entry))

      expect(await guestMailboxLimiter.retryAfterMs('pilot@example.ch', NOW)).toBe(0)
    })
  })
})
