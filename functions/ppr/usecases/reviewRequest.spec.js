'use strict'

const reviewRequest = require('./reviewRequest')

const NOW = Date.now()

const pendingRequest = {
  status: 'pending',
  firstname: 'Max',
  lastname: 'Muster',
  email: 'max@example.com',
  immatriculation: 'HB-ABC',
  plannedDate: '2026-04-15',
  plannedTime: '10:30',
  flightType: 'private',
  createdBy: 'max@example.com'
}

const TOKEN = 'T'.repeat(43)
const HASH = 'b'.repeat(64)
const RECEIPT_HASH = 'a'.repeat(64)

// Behaves like the atomic repository method: applies the data (or what the
// data function returns for the request) only if the request exists and the
// predicate holds; the applied changes are kept in `changes`
function createMockDeps(existing) {
  const deps = {
    repository: {
      updateIf: jest.fn(async (key, predicate, data) => {
        if (!existing) return { applied: false, request: null }
        const current = { key, ...existing }
        if (!predicate(current)) return { applied: false, request: current }
        deps.changes = typeof data === 'function' ? data(current) : data
        return { applied: true, request: { ...current, ...deps.changes } }
      })
    },
    notifier: {
      notifyRequestReviewed: jest.fn().mockResolvedValue()
    },
    statusTokens: {
      create: jest.fn(() => ({ token: TOKEN, hash: HASH }))
    }
  }
  return deps
}

describe('reviewRequest', () => {
  const approveReview = {
    status: 'approved',
    reviewedBy: 'admin@aero.ch',
    reviewedAt: NOW
  }

  const rejectReview = {
    status: 'rejected',
    reviewedBy: 'admin@aero.ch',
    reviewedAt: NOW,
    reviewRemarks: 'Weather conditions'
  }

  it('approves a pending request', async () => {
    const deps = createMockDeps(pendingRequest)
    await reviewRequest(deps, 'req-123', approveReview)

    expect(deps.repository.updateIf).toHaveBeenCalledWith('req-123', expect.any(Function), expect.any(Function))
    expect(deps.changes).toEqual({
      status: 'approved',
      reviewedBy: 'admin@aero.ch',
      reviewedAt: NOW,
      statusTokens: { [HASH]: NOW }
    })
  })

  it('rejects a pending request with remarks', async () => {
    const deps = createMockDeps(pendingRequest)
    await reviewRequest(deps, 'req-123', rejectReview)

    expect(deps.changes).toEqual({
      status: 'rejected',
      reviewedBy: 'admin@aero.ch',
      reviewedAt: NOW,
      reviewRemarks: 'Weather conditions',
      statusTokens: { [HASH]: NOW }
    })
  })

  it('adds the hash of a new status token in the same step, keeping the receipt\'s', async () => {
    const deps = createMockDeps({ ...pendingRequest, statusTokens: { [RECEIPT_HASH]: NOW - 1000 } })
    await reviewRequest(deps, 'req-123', approveReview)

    expect(deps.changes.statusTokens).toEqual({ [RECEIPT_HASH]: NOW - 1000, [HASH]: NOW })
  })

  it('notifies pilot after review, with the new status token', async () => {
    const deps = createMockDeps(pendingRequest)
    await reviewRequest(deps, 'req-123', approveReview)

    expect(deps.notifier.notifyRequestReviewed).toHaveBeenCalledTimes(1)
    const [notified, token] = deps.notifier.notifyRequestReviewed.mock.calls[0]
    expect(notified.key).toBe('req-123')
    expect(notified.status).toBe('approved')
    expect(notified.email).toBe('max@example.com')
    expect(token).toBe(TOKEN)
  })

  it('notifies pilot in the language stored with the request', async () => {
    const deps = createMockDeps({ ...pendingRequest, language: 'en' })
    await reviewRequest(deps, 'req-123', rejectReview)

    const notified = deps.notifier.notifyRequestReviewed.mock.calls[0][0]
    expect(notified.language).toBe('en')
  })

  it('throws NOT_FOUND when request does not exist', async () => {
    const deps = createMockDeps(null)

    await expect(reviewRequest(deps, 'req-999', approveReview))
      .rejects.toThrow('PPR request not found')

    expect(deps.notifier.notifyRequestReviewed).not.toHaveBeenCalled()
  })

  it('throws when request is already approved', async () => {
    const deps = createMockDeps({ ...pendingRequest, status: 'approved' })

    await expect(reviewRequest(deps, 'req-123', rejectReview))
      .rejects.toThrow('Can only review requests with pending status')
  })

  it('throws when request is already rejected', async () => {
    const deps = createMockDeps({ ...pendingRequest, status: 'rejected' })

    await expect(reviewRequest(deps, 'req-123', approveReview))
      .rejects.toThrow('Can only review requests with pending status')
  })

  it('does not notify when the request was already decided', async () => {
    const deps = createMockDeps({ ...pendingRequest, status: 'approved' })

    await expect(reviewRequest(deps, 'req-123', rejectReview)).rejects.toThrow()
    expect(deps.notifier.notifyRequestReviewed).not.toHaveBeenCalled()
  })

  it('checks the target status before touching the repository', async () => {
    const deps = createMockDeps(pendingRequest)

    await expect(reviewRequest(deps, 'req-123', { ...approveReview, status: 'pending' }))
      .rejects.toThrow('New status must be approved or rejected')
    expect(deps.repository.updateIf).not.toHaveBeenCalled()
    expect(deps.statusTokens.create).not.toHaveBeenCalled()
  })

  it('throws on invalid target status', async () => {
    const deps = createMockDeps(pendingRequest)

    await expect(reviewRequest(deps, 'req-123', {
      ...approveReview,
      status: 'cancelled'
    })).rejects.toThrow('New status must be approved or rejected')
  })

  it('stores the review remarks as entered, trimmed', async () => {
    const deps = createMockDeps(pendingRequest)
    await reviewRequest(deps, 'req-123', {
      ...rejectReview,
      reviewRemarks: '  Nur Flugzeuge < 2t, Ankunft > 14:00 LT  '
    })

    expect(deps.changes.reviewRemarks).toBe('Nur Flugzeuge < 2t, Ankunft > 14:00 LT')
  })

  it('marks a request that is no longer pending with NOT_PENDING', async () => {
    const deps = createMockDeps({ ...pendingRequest, status: 'approved' })

    await expect(reviewRequest(deps, 'req-123', rejectReview))
      .rejects.toThrow(expect.objectContaining({ code: 'NOT_PENDING' }))
  })

  it('omits reviewRemarks when not provided', async () => {
    const deps = createMockDeps(pendingRequest)
    await reviewRequest(deps, 'req-123', approveReview)

    expect(deps.changes).not.toHaveProperty('reviewRemarks')
  })

  it('succeeds even when notification fails', async () => {
    const deps = createMockDeps(pendingRequest)
    deps.notifier.notifyRequestReviewed.mockRejectedValue(new Error('SMTP down'))

    await expect(reviewRequest(deps, 'req-123', approveReview))
      .resolves.toBeUndefined()
    expect(deps.repository.updateIf).toHaveBeenCalled()
  })
})
