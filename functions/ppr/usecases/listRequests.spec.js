'use strict'

const listRequests = require('./listRequests')

const HASH = 'a'.repeat(64)

const allRequests = [
  { key: 'req-1', email: 'a@example.com', statusTokens: { [HASH]: 1 } },
  { key: 'req-2', email: 'b@example.com', withoutLogin: true }
]

const userRequests = [
  { key: 'req-1', email: 'a@example.com', statusTokens: { [HASH]: 1 } }
]

function createMockDeps() {
  return {
    repository: {
      findAll: jest.fn().mockResolvedValue(allRequests),
      findByEmail: jest.fn().mockResolvedValue(userRequests)
    }
  }
}

describe('listRequests', () => {
  it('returns all requests for admin, with the mark of requests without login', async () => {
    const deps = createMockDeps()
    const result = await listRequests(deps, { email: 'admin@aero.ch', isAdmin: true })

    expect(result).toEqual([
      { key: 'req-1', email: 'a@example.com' },
      { key: 'req-2', email: 'b@example.com', withoutLogin: true }
    ])
    expect(deps.repository.findAll).toHaveBeenCalledTimes(1)
    expect(deps.repository.findByEmail).not.toHaveBeenCalled()
  })

  it('returns only own requests for non-admin', async () => {
    const deps = createMockDeps()
    const result = await listRequests(deps, { email: 'a@example.com', isAdmin: false })

    expect(result).toEqual([{ key: 'req-1', email: 'a@example.com' }])
    expect(deps.repository.findByEmail).toHaveBeenCalledWith('a@example.com')
    expect(deps.repository.findAll).not.toHaveBeenCalled()
  })

  it.each([[true], [false]])('never returns the hashes of the status links (isAdmin %p)', async isAdmin => {
    const result = await listRequests(createMockDeps(), { email: 'a@example.com', isAdmin })

    result.forEach(request => expect(request).not.toHaveProperty('statusTokens'))
    expect(JSON.stringify(result)).not.toContain(HASH)
  })
})
