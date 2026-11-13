'use strict'

const submitRequest = require('./submitRequest')

// 14:00 in Zurich
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

function createMockDeps({ adminEmail = 'admin@aero.ch', answerSettings = {}, aerodromeStatus = null } = {}) {
  return {
    repository: {
      save: jest.fn().mockResolvedValue({ key: 'req-123' })
    },
    notifier: {
      notifyRequestSubmitted: jest.fn().mockResolvedValue(),
      notifyRequestReviewed: jest.fn().mockResolvedValue()
    },
    settings: {
      getAdminEmail: jest.fn().mockResolvedValue(adminEmail),
      getAnswerSettings: jest.fn().mockResolvedValue({
        answerMode: null, pilotInfo: null, closures: null, ...answerSettings
      })
    },
    aerodromeStatus: {
      getCurrent: jest.fn().mockResolvedValue(aerodromeStatus)
    }
  }
}

describe('submitRequest', () => {
  describe('manual answers', () => {
    it('saves a pending request and returns its key and status', async () => {
      const deps = createMockDeps()
      const result = await submitRequest(deps, validInput, NOW)

      expect(result).toEqual({ key: 'req-123', status: 'pending' })
      expect(deps.repository.save).toHaveBeenCalledTimes(1)

      const saved = deps.repository.save.mock.calls[0][0]
      expect(saved.status).toBe('pending')
      expect(saved.firstname).toBe('Max')
      expect(saved.email).toBe('max@example.com')
      expect(saved.immatriculation).toBe('HB-ABC')
      expect(saved.reviewedBy).toBeUndefined()
    })

    it('notifies the admin with the saved request including its key, and not the pilot', async () => {
      const deps = createMockDeps()
      await submitRequest(deps, validInput, NOW)

      expect(deps.notifier.notifyRequestSubmitted).toHaveBeenCalledTimes(1)
      const [request, adminEmail] = deps.notifier.notifyRequestSubmitted.mock.calls[0]
      expect(request.key).toBe('req-123')
      expect(request.firstname).toBe('Max')
      expect(adminEmail).toBe('admin@aero.ch')
      expect(deps.notifier.notifyRequestReviewed).not.toHaveBeenCalled()
    })

    it('warns when no notification address is set', async () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
      const deps = createMockDeps({ adminEmail: null })

      await submitRequest(deps, validInput, NOW)

      expect(deps.notifier.notifyRequestSubmitted).not.toHaveBeenCalled()
      expect(warn).toHaveBeenCalledWith('No PPR notification address is set, request not announced:', 'req-123')
      warn.mockRestore()
    })
  })

  describe('automatic answers', () => {
    const automatic = { answerMode: 'automatic', pilotInfo: 'Runway 05/23, landing fee CHF 20' }

    it('saves the request approved with the information for pilots', async () => {
      const deps = createMockDeps({ answerSettings: automatic })
      const result = await submitRequest(deps, validInput, NOW)

      expect(result).toEqual({ key: 'req-123', status: 'approved', reviewRemarks: 'Runway 05/23, landing fee CHF 20' })
      expect(deps.repository.save.mock.calls[0][0]).toEqual(expect.objectContaining({
        status: 'approved',
        reviewedBy: 'automatic',
        reviewedAt: NOW,
        reviewRemarks: 'Runway 05/23, landing fee CHF 20'
      }))
    })

    it('sends the pilot the approval and the admin the request', async () => {
      const deps = createMockDeps({ answerSettings: automatic })
      await submitRequest(deps, validInput, NOW)

      expect(deps.notifier.notifyRequestReviewed).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'req-123', status: 'approved', email: 'max@example.com' })
      )
      expect(deps.notifier.notifyRequestSubmitted).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'req-123', status: 'approved' }), 'admin@aero.ch'
      )
    })

    it('needs no notification address: nobody has to answer', async () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
      const deps = createMockDeps({ adminEmail: null, answerSettings: automatic })

      await submitRequest(deps, validInput, NOW)

      expect(warn).not.toHaveBeenCalled()
      expect(deps.notifier.notifyRequestReviewed).toHaveBeenCalledTimes(1)
      warn.mockRestore()
    })

    it('approves without remarks when there is no information for pilots', async () => {
      const deps = createMockDeps({ answerSettings: { answerMode: 'automatic' } })
      const result = await submitRequest(deps, validInput, NOW)

      expect(result).toEqual({ key: 'req-123', status: 'approved' })
      expect(deps.repository.save.mock.calls[0][0].reviewRemarks).toBeUndefined()
    })
  })

  describe('closed aerodrome', () => {
    it('rejects a request within a closure with its reason, also with manual answers', async () => {
      const deps = createMockDeps({
        answerSettings: { closures: { 0: { from: '2026-04-14', to: '2026-04-16', reason: 'Runway works' } } }
      })
      const result = await submitRequest(deps, validInput, NOW)

      expect(result).toEqual({ key: 'req-123', status: 'rejected', reviewRemarks: 'Runway works' })
      expect(deps.repository.save.mock.calls[0][0]).toEqual(expect.objectContaining({
        status: 'rejected', reviewedBy: 'automatic', reviewRemarks: 'Runway works'
      }))
      expect(deps.notifier.notifyRequestReviewed).toHaveBeenCalledWith(expect.objectContaining({ status: 'rejected' }))
    })

    it('rejects a request for today while the aerodrome status is closed', async () => {
      const deps = createMockDeps({ aerodromeStatus: { status: 'closed', details: 'Thunderstorms' } })
      const result = await submitRequest(deps, { ...validInput, plannedDate: '2026-04-01' }, NOW)

      expect(result).toEqual({ key: 'req-123', status: 'rejected', reviewRemarks: 'Thunderstorms' })
    })

    it('ignores closures stored invalidly', async () => {
      const deps = createMockDeps({ answerSettings: { closures: { 0: { from: 'soon', to: 'later', reason: 'x' } } } })

      expect((await submitRequest(deps, validInput, NOW)).status).toBe('pending')
    })

    it('still accepts requests when the aerodrome status cannot be read', async () => {
      const error = jest.spyOn(console, 'error').mockImplementation(() => undefined)
      const deps = createMockDeps()
      deps.aerodromeStatus.getCurrent.mockRejectedValue(new Error('DB error'))

      const result = await submitRequest(deps, { ...validInput, plannedDate: '2026-04-01' }, NOW)

      expect(result.status).toBe('pending')
      error.mockRestore()
    })
  })

  it('propagates validation errors from domain', async () => {
    const deps = createMockDeps()
    const badInput = { ...validInput, email: 'invalid' }

    await expect(submitRequest(deps, badInput, NOW)).rejects.toThrow('Invalid email format')
    expect(deps.repository.save).not.toHaveBeenCalled()
  })

  it('propagates repository errors', async () => {
    const deps = createMockDeps()
    deps.repository.save.mockRejectedValue(new Error('DB error'))

    await expect(submitRequest(deps, validInput, NOW)).rejects.toThrow('DB error')
  })

  it('succeeds even when the notifications fail', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => undefined)
    const deps = createMockDeps({ answerSettings: { answerMode: 'automatic' } })
    deps.notifier.notifyRequestSubmitted.mockRejectedValue(new Error('SMTP down'))
    deps.notifier.notifyRequestReviewed.mockImplementation(() => { throw new Error('SMTP down') })

    const result = await submitRequest(deps, validInput, NOW)
    expect(result).toEqual({ key: 'req-123', status: 'approved' })
    expect(error).toHaveBeenCalledTimes(2)
    error.mockRestore()
  })

  it('sends both emails at the same time', async () => {
    const deps = createMockDeps({ answerSettings: { answerMode: 'automatic' } })
    let sendSubmitted
    deps.notifier.notifyRequestSubmitted.mockReturnValue(new Promise(resolve => { sendSubmitted = resolve }))

    const submitted = submitRequest(deps, validInput, NOW)
    await new Promise(resolve => setTimeout(resolve, 0))

    // The pilot's answer is on its way while the admin's email is not sent yet
    expect(deps.notifier.notifyRequestReviewed).toHaveBeenCalledTimes(1)
    sendSubmitted()
    await expect(submitted).resolves.toEqual({ key: 'req-123', status: 'approved' })
  })
})
