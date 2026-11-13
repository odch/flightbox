'use strict'

const revokeApproval = require('./revokeApproval')

const NOW = Date.now()

const approvedRequest = {
  status: 'approved',
  reviewedBy: 'automatic',
  reviewRemarks: 'Runway 05/23',
  email: 'max@example.com',
  immatriculation: 'HB-ABC',
  plannedDate: '2026-04-15',
  plannedTime: '10:30'
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

const revocation = { reviewedBy: 'admin@aero.ch', reviewedAt: NOW, reviewRemarks: ' Closed due to runway works ' }

describe('revokeApproval', () => {
  it('revokes an approval with the reason and tells the pilot', async () => {
    const deps = createMockDeps(approvedRequest)

    await revokeApproval(deps, 'req-1', revocation)

    expect(deps.repository.updateIf).toHaveBeenCalledWith('req-1', expect.any(Function), {
      status: 'revoked',
      reviewedBy: 'admin@aero.ch',
      reviewedAt: NOW,
      reviewRemarks: 'Closed due to runway works'
    })
    expect(deps.notifier.notifyRequestReviewed).toHaveBeenCalledWith(expect.objectContaining({
      key: 'req-1', status: 'revoked', email: 'max@example.com', reviewRemarks: 'Closed due to runway works'
    }))
  })

  it.each([undefined, '', '   '])('needs a reason (%p)', async reviewRemarks => {
    const deps = createMockDeps(approvedRequest)

    await expect(revokeApproval(deps, 'req-1', { ...revocation, reviewRemarks }))
      .rejects.toThrow(expect.objectContaining({ code: 'INVALID_INPUT' }))
    expect(deps.repository.updateIf).not.toHaveBeenCalled()
  })

  it('throws NOT_FOUND for a missing request', async () => {
    await expect(revokeApproval(createMockDeps(null), 'nope', revocation))
      .rejects.toThrow(expect.objectContaining({ code: 'NOT_FOUND' }))
  })

  it.each(['pending', 'rejected', 'revoked'])('refuses a %s request', async status => {
    const deps = createMockDeps({ ...approvedRequest, status })

    await expect(revokeApproval(deps, 'req-1', revocation))
      .rejects.toThrow(expect.objectContaining({ code: 'NOT_APPROVED' }))
    expect(deps.notifier.notifyRequestReviewed).not.toHaveBeenCalled()
  })

  it('succeeds even when the email fails', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => undefined)
    const deps = createMockDeps(approvedRequest)
    deps.notifier.notifyRequestReviewed.mockRejectedValue(new Error('SMTP down'))

    await expect(revokeApproval(deps, 'req-1', revocation)).resolves.toBeUndefined()
    error.mockRestore()
  })
})
