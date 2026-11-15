'use strict'

const getRequestStatus = require('./getRequestStatus')

const TOKEN = 'T'.repeat(43)
const HASH = 'a'.repeat(64)

const storedRequest = {
  key: 'req-1',
  status: 'approved',
  firstname: 'Max',
  lastname: 'Muster',
  email: 'max@example.com',
  phone: '+41 79 123 45 67',
  immatriculation: 'HB-ABC',
  plannedDate: '2026-11-20',
  plannedTime: '10:30',
  flightType: 'private',
  remarks: 'Training',
  createdBy: 'max@example.com',
  reviewedBy: 'admin@aero.ch',
  reviewRemarks: 'Runway 23 only',
  statusTokens: { [HASH]: 1 }
}

// Tokens match their hash only: TOKEN is the one of HASH
function createMockDeps(existing) {
  return {
    repository: {
      findByKey: jest.fn().mockResolvedValue(existing)
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

describe('getRequestStatus', () => {
  it('shows the holder of the link the status without personal data', async () => {
    const deps = createMockDeps(storedRequest)

    const result = await getRequestStatus(deps, 'req-1', TOKEN)

    expect(result).toEqual({
      status: 'approved',
      immatriculation: 'HB-ABC',
      plannedDate: '2026-11-20',
      plannedTime: '10:30',
      flightType: 'private',
      reviewRemarks: 'Runway 23 only',
      automatic: false,
      canWithdraw: false
    })
    expect(deps.repository.findByKey).toHaveBeenCalledWith('req-1')
    expect(deps.statusTokens.matches).toHaveBeenCalledWith(TOKEN, [HASH])
  })

  it.each([
    ['a missing request', null, TOKEN],
    ['a wrong token', storedRequest, 'W'.repeat(43)],
    ['a request without status tokens', { ...storedRequest, statusTokens: undefined }, TOKEN]
  ])('answers NOT_FOUND for %s', async (name, existing, token) => {
    const err = await errorOf(getRequestStatus(createMockDeps(existing), 'req-1', token))

    expect(err.code).toBe('NOT_FOUND')
    expect(err.message).toBe('PPR request not found')
  })
})
