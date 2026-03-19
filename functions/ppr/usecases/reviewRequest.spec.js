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

// Behaves like the atomic repository method: applies the data only if the
// request exists and the predicate holds
function createMockDeps(existing) {
  return {
    repository: {
      updateIf: jest.fn(async (key, predicate, data) => {
        if (!existing) return { applied: false, request: null }
        const current = { key, ...existing }
        if (!predicate(current)) return { applied: false, request: current }
        return { applied: true, request: { ...current, ...data } }
      })
    },
    notifier: {
      notifyRequestReviewed: jest.fn().mockResolvedValue()
    }
  }
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

    expect(deps.repository.updateIf).toHaveBeenCalledWith('req-123', expect.any(Function), {
      status: 'approved',
      reviewedBy: 'admin@aero.ch',
      reviewedAt: NOW
    })
  })

  it('rejects a pending request with remarks', async () => {
    const deps = createMockDeps(pendingRequest)
    await reviewRequest(deps, 'req-123', rejectReview)

    expect(deps.repository.updateIf).toHaveBeenCalledWith('req-123', expect.any(Function), {
      status: 'rejected',
      reviewedBy: 'admin@aero.ch',
      reviewedAt: NOW,
      reviewRemarks: 'Weather conditions'
    })
  })

  it('notifies pilot after review', async () => {
    const deps = createMockDeps(pendingRequest)
    await reviewRequest(deps, 'req-123', approveReview)

    expect(deps.notifier.notifyRequestReviewed).toHaveBeenCalledTimes(1)
    const notified = deps.notifier.notifyRequestReviewed.mock.calls[0][0]
    expect(notified.key).toBe('req-123')
    expect(notified.status).toBe('approved')
    expect(notified.email).toBe('max@example.com')
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

    const updateCall = deps.repository.updateIf.mock.calls[0][2]
    expect(updateCall.reviewRemarks).toBe('Nur Flugzeuge < 2t, Ankunft > 14:00 LT')
  })

  it('marks a request that is no longer pending with NOT_PENDING', async () => {
    const deps = createMockDeps({ ...pendingRequest, status: 'approved' })

    await expect(reviewRequest(deps, 'req-123', rejectReview))
      .rejects.toThrow(expect.objectContaining({ code: 'NOT_PENDING' }))
  })

  it('omits reviewRemarks when not provided', async () => {
    const deps = createMockDeps(pendingRequest)
    await reviewRequest(deps, 'req-123', approveReview)

    const updateCall = deps.repository.updateIf.mock.calls[0][2]
    expect(updateCall.reviewRemarks).toBeUndefined()
  })

  it('succeeds even when notification fails', async () => {
    const deps = createMockDeps(pendingRequest)
    deps.notifier.notifyRequestReviewed.mockRejectedValue(new Error('SMTP down'))

    await expect(reviewRequest(deps, 'req-123', approveReview))
      .resolves.toBeUndefined()
    expect(deps.repository.updateIf).toHaveBeenCalled()
  })
})
