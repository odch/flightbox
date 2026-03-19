'use strict'

const deleteRequest = require('./deleteRequest')

const existingRequest = {
  status: 'pending',
  email: 'max@example.com',
  createdBy: 'max@example.com'
}

function createMockDeps(existing) {
  return {
    repository: {
      findByKey: jest.fn().mockResolvedValue(existing || null),
      deleteByKey: jest.fn().mockResolvedValue()
    }
  }
}

describe('deleteRequest', () => {
  it('deletes a request owned by the user', async () => {
    const deps = createMockDeps(existingRequest)
    await deleteRequest(deps, 'req-123', 'max@example.com')

    expect(deps.repository.findByKey).toHaveBeenCalledWith('req-123')
    expect(deps.repository.deleteByKey).toHaveBeenCalledWith('req-123')
  })

  it('throws NOT_FOUND when request does not exist', async () => {
    const deps = createMockDeps(null)

    await expect(deleteRequest(deps, 'req-999', 'max@example.com'))
      .rejects.toThrow('PPR request not found')

    expect(deps.repository.deleteByKey).not.toHaveBeenCalled()
  })

  it('throws FORBIDDEN when user does not own the request', async () => {
    const deps = createMockDeps(existingRequest)

    await expect(deleteRequest(deps, 'req-123', 'other@example.com'))
      .rejects.toThrow('Not authorized to delete this request')

    expect(deps.repository.deleteByKey).not.toHaveBeenCalled()
  })

  it('sets error code to FORBIDDEN on ownership check failure', async () => {
    const deps = createMockDeps(existingRequest)

    try {
      await deleteRequest(deps, 'req-123', 'other@example.com')
    } catch (err) {
      expect(err.code).toBe('FORBIDDEN')
    }
  })

  it('sets error code to NOT_FOUND when request missing', async () => {
    const deps = createMockDeps(null)

    try {
      await deleteRequest(deps, 'req-999', 'max@example.com')
    } catch (err) {
      expect(err.code).toBe('NOT_FOUND')
    }
  })
})
