'use strict'

const submitRequest = require('./submitRequest')

const NOW = new Date('2026-04-01T12:00:00Z').getTime()

const validInput = {
  firstname: 'Max',
  lastname: 'Muster',
  email: 'max@example.com',
  immatriculation: 'HB-ABC',
  plannedDate: '2026-04-15',
  plannedTime: '10:30',
  flightType: 'private',
  createdBy: 'max@example.com'
}

function createMockDeps() {
  return {
    repository: {
      save: jest.fn().mockResolvedValue({ key: 'req-123' })
    },
    notifier: {
      notifyRequestSubmitted: jest.fn().mockResolvedValue()
    }
  }
}

describe('submitRequest', () => {
  it('creates and saves a PPR request', async () => {
    const deps = createMockDeps()
    const result = await submitRequest(deps, validInput, 'admin@aero.ch', NOW)

    expect(result).toEqual({ key: 'req-123' })
    expect(deps.repository.save).toHaveBeenCalledTimes(1)

    const saved = deps.repository.save.mock.calls[0][0]
    expect(saved.status).toBe('pending')
    expect(saved.firstname).toBe('Max')
    expect(saved.email).toBe('max@example.com')
    expect(saved.immatriculation).toBe('HB-ABC')
  })

  it('notifies admin with the saved request including key', async () => {
    const deps = createMockDeps()
    await submitRequest(deps, validInput, 'admin@aero.ch', NOW)

    expect(deps.notifier.notifyRequestSubmitted).toHaveBeenCalledTimes(1)
    const [request, adminEmail] = deps.notifier.notifyRequestSubmitted.mock.calls[0]
    expect(request.key).toBe('req-123')
    expect(request.firstname).toBe('Max')
    expect(adminEmail).toBe('admin@aero.ch')
  })

  it('skips notification when adminEmail is not provided', async () => {
    const deps = createMockDeps()
    await submitRequest(deps, validInput, null, NOW)

    expect(deps.notifier.notifyRequestSubmitted).not.toHaveBeenCalled()
  })

  it('propagates validation errors from domain', async () => {
    const deps = createMockDeps()
    const badInput = { ...validInput, email: 'invalid' }

    await expect(submitRequest(deps, badInput, 'admin@aero.ch', NOW))
      .rejects.toThrow('Invalid email format')
    expect(deps.repository.save).not.toHaveBeenCalled()
  })

  it('propagates repository errors', async () => {
    const deps = createMockDeps()
    deps.repository.save.mockRejectedValue(new Error('DB error'))

    await expect(submitRequest(deps, validInput, 'admin@aero.ch', NOW))
      .rejects.toThrow('DB error')
  })

  it('succeeds even when notification fails', async () => {
    const deps = createMockDeps()
    deps.notifier.notifyRequestSubmitted.mockRejectedValue(new Error('SMTP down'))

    const result = await submitRequest(deps, validInput, 'admin@aero.ch', NOW)
    expect(result).toEqual({ key: 'req-123' })
  })
})
