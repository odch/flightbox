'use strict'

const deleteRequest = require('./deleteRequest')

const existingRequest = {
  status: 'pending',
  email: 'max@example.com',
  createdBy: 'max@example.com'
}

// Behaves like the atomic repository method: deletes only if the request
// exists and the predicate holds
function createMockDeps(existing) {
  return {
    repository: {
      removeIf: jest.fn(async (key, predicate) => {
        if (!existing) return { applied: false, request: null }
        const current = { key, ...existing }
        return { applied: predicate(current), request: current }
      })
    }
  }
}

async function errorOf(promise) {
  try {
    await promise
  } catch (err) {
    return err
  }
  throw new Error('expected an error')
}

describe('deleteRequest', () => {
  it('deletes a pending request owned by the user', async () => {
    const deps = createMockDeps(existingRequest)

    await expect(deleteRequest(deps, 'req-123', 'max@example.com')).resolves.toBeUndefined()

    expect(deps.repository.removeIf).toHaveBeenCalledWith('req-123', expect.any(Function))
  })

  it('throws NOT_FOUND when request does not exist', async () => {
    const err = await errorOf(deleteRequest(createMockDeps(null), 'req-999', 'max@example.com'))
    expect(err.message).toBe('PPR request not found')
    expect(err.code).toBe('NOT_FOUND')
  })

  it('throws FORBIDDEN when user does not own the request', async () => {
    const err = await errorOf(deleteRequest(createMockDeps(existingRequest), 'req-123', 'other@example.com'))
    expect(err.message).toBe('Not authorized to delete this request')
    expect(err.code).toBe('FORBIDDEN')
  })

  it.each(['approved', 'rejected'])('throws NOT_PENDING for a %s request', async status => {
    const deps = createMockDeps({ ...existingRequest, status })

    const err = await errorOf(deleteRequest(deps, 'req-123', 'max@example.com'))

    expect(err.message).toBe('Only pending requests can be deleted')
    expect(err.code).toBe('NOT_PENDING')
  })
})
