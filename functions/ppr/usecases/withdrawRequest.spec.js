'use strict'

const withdrawRequest = require('./withdrawRequest')

const TOKEN = 'T'.repeat(43)
const HASH = 'a'.repeat(64)

const pendingRequest = {
  status: 'pending',
  email: 'max@example.com',
  withoutLogin: true,
  statusTokens: { [HASH]: 1 }
}

// Behaves like the atomic repository method: deletes only if the request
// exists and the predicate holds. Tokens match their hash only: TOKEN is the
// one of HASH.
function createMockDeps(existing) {
  return {
    repository: {
      removeIf: jest.fn(async (key, predicate) => {
        if (!existing) return { applied: false, request: null }
        const current = { key, ...existing }
        return { applied: predicate(current), request: current }
      })
    },
    statusTokens: {
      matches: jest.fn((token, hashes) => token === TOKEN && hashes.includes(HASH))
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

describe('withdrawRequest', () => {
  it('deletes a pending request for the holder of its link', async () => {
    const deps = createMockDeps(pendingRequest)

    await expect(withdrawRequest(deps, 'req-1', TOKEN)).resolves.toBeUndefined()

    expect(deps.repository.removeIf).toHaveBeenCalledWith('req-1', expect.any(Function))
  })

  it('checks the token and the status in the atomic step', async () => {
    const deps = createMockDeps(pendingRequest)
    await withdrawRequest(deps, 'req-1', TOKEN)

    const predicate = deps.repository.removeIf.mock.calls[0][1]
    expect(predicate({ ...pendingRequest })).toBe(true)
    expect(predicate({ ...pendingRequest, status: 'approved' })).toBe(false)
    expect(predicate({ ...pendingRequest, statusTokens: { ['b'.repeat(64)]: 1 } })).toBe(false)
  })

  it.each([
    ['a missing request', null, TOKEN],
    ['a wrong token', pendingRequest, 'W'.repeat(43)],
    ['a wrong token for an answered request', { ...pendingRequest, status: 'approved' }, 'W'.repeat(43)]
  ])('answers NOT_FOUND for %s', async (name, existing, token) => {
    const err = await errorOf(withdrawRequest(createMockDeps(existing), 'req-1', token))

    expect(err.code).toBe('NOT_FOUND')
  })

  it.each(['approved', 'rejected', 'revoked'])('answers NOT_PENDING for a %s request', async status => {
    const err = await errorOf(withdrawRequest(createMockDeps({ ...pendingRequest, status }), 'req-1', TOKEN))

    expect(err.code).toBe('NOT_PENDING')
    expect(err.message).toBe('Only pending requests can be withdrawn')
  })
})
