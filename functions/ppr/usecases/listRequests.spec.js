'use strict'

const listRequests = require('./listRequests')

const allRequests = [
  { key: 'req-1', email: 'a@example.com' },
  { key: 'req-2', email: 'b@example.com' }
]

const userRequests = [
  { key: 'req-1', email: 'a@example.com' }
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
  it('returns all requests for admin', async () => {
    const deps = createMockDeps()
    const result = await listRequests(deps, { email: 'admin@aero.ch', isAdmin: true })

    expect(result).toEqual(allRequests)
    expect(deps.repository.findAll).toHaveBeenCalledTimes(1)
    expect(deps.repository.findByEmail).not.toHaveBeenCalled()
  })

  it('returns only own requests for non-admin', async () => {
    const deps = createMockDeps()
    const result = await listRequests(deps, { email: 'a@example.com', isAdmin: false })

    expect(result).toEqual(userRequests)
    expect(deps.repository.findByEmail).toHaveBeenCalledWith('a@example.com')
    expect(deps.repository.findAll).not.toHaveBeenCalled()
  })
})
