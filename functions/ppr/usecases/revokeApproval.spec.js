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

const TOKEN = 'T'.repeat(43)
const HASH = 'b'.repeat(64)
const ANSWER_HASH = 'a'.repeat(64)

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

const revocation = { reviewedBy: 'admin@aero.ch', reviewedAt: NOW, reviewRemarks: ' Closed due to runway works ' }

describe('revokeApproval', () => {
  it('revokes an approval with the reason and tells the pilot, with a new status token', async () => {
    const deps = createMockDeps(approvedRequest)

    await revokeApproval(deps, 'req-1', revocation)

    expect(deps.repository.updateIf).toHaveBeenCalledWith('req-1', expect.any(Function), expect.any(Function))
    expect(deps.changes).toEqual({
      status: 'revoked',
      reviewedBy: 'admin@aero.ch',
      reviewedAt: NOW,
      reviewRemarks: 'Closed due to runway works',
      statusTokens: { [HASH]: NOW }
    })
    expect(deps.notifier.notifyRequestReviewed).toHaveBeenCalledWith(expect.objectContaining({
      key: 'req-1', status: 'revoked', email: 'max@example.com', reviewRemarks: 'Closed due to runway works'
    }), TOKEN)
  })

  it('adds the hash of the new status token in the same step, keeping the others', async () => {
    const deps = createMockDeps({ ...approvedRequest, statusTokens: { [ANSWER_HASH]: NOW - 1000 } })

    await revokeApproval(deps, 'req-1', revocation)

    expect(deps.changes.statusTokens).toEqual({ [ANSWER_HASH]: NOW - 1000, [HASH]: NOW })
  })

  it.each([undefined, '', '   '])('needs a reason (%p)', async reviewRemarks => {
    const deps = createMockDeps(approvedRequest)

    await expect(revokeApproval(deps, 'req-1', { ...revocation, reviewRemarks }))
      .rejects.toThrow(expect.objectContaining({ code: 'INVALID_INPUT' }))
    expect(deps.repository.updateIf).not.toHaveBeenCalled()
    expect(deps.statusTokens.create).not.toHaveBeenCalled()
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
