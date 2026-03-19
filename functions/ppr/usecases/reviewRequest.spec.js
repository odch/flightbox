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

function createMockDeps(existing) {
  return {
    repository: {
      findByKey: jest.fn().mockResolvedValue(existing || null),
      updateStatus: jest.fn().mockResolvedValue()
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

    expect(deps.repository.updateStatus).toHaveBeenCalledWith('req-123', {
      status: 'approved',
      reviewedBy: 'admin@aero.ch',
      reviewedAt: NOW
    })
  })

  it('rejects a pending request with remarks', async () => {
    const deps = createMockDeps(pendingRequest)
    await reviewRequest(deps, 'req-123', rejectReview)

    expect(deps.repository.updateStatus).toHaveBeenCalledWith('req-123', {
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

  it('throws NOT_FOUND when request does not exist', async () => {
    const deps = createMockDeps(null)

    await expect(reviewRequest(deps, 'req-999', approveReview))
      .rejects.toThrow('PPR request not found')

    expect(deps.repository.updateStatus).not.toHaveBeenCalled()
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

  it('throws on invalid target status', async () => {
    const deps = createMockDeps(pendingRequest)

    await expect(reviewRequest(deps, 'req-123', {
      ...approveReview,
      status: 'cancelled'
    })).rejects.toThrow('New status must be approved or rejected')
  })

  it('sanitizes review remarks', async () => {
    const deps = createMockDeps(pendingRequest)
    await reviewRequest(deps, 'req-123', {
      ...rejectReview,
      reviewRemarks: '<script>alert("xss")</script>Bad weather'
    })

    const updateCall = deps.repository.updateStatus.mock.calls[0][1]
    expect(updateCall.reviewRemarks).toBe('alert("xss")Bad weather')
  })

  it('omits reviewRemarks when not provided', async () => {
    const deps = createMockDeps(pendingRequest)
    await reviewRequest(deps, 'req-123', approveReview)

    const updateCall = deps.repository.updateStatus.mock.calls[0][1]
    expect(updateCall.reviewRemarks).toBeUndefined()
  })

  it('succeeds even when notification fails', async () => {
    const deps = createMockDeps(pendingRequest)
    deps.notifier.notifyRequestReviewed.mockRejectedValue(new Error('SMTP down'))

    await expect(reviewRequest(deps, 'req-123', approveReview))
      .resolves.toBeUndefined()
    expect(deps.repository.updateStatus).toHaveBeenCalled()
  })
})
