'use strict'

const submitRequest = require('./submitRequest')

// 14:00 in Zurich
const NOW = new Date('2026-04-01T12:00:00Z').getTime()

const TOKEN = 'T'.repeat(43)
const HASH = 'a'.repeat(64)

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
      notifyRequestReceived: jest.fn().mockResolvedValue(),
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
    },
    statusTokens: {
      create: jest.fn(() => ({ token: TOKEN, hash: HASH }))
    }
  }
}

describe('submitRequest', () => {
  describe('manual answers', () => {
    it('saves a pending request and returns its key, status and status token', async () => {
      const deps = createMockDeps()
      const result = await submitRequest(deps, validInput, NOW)

      expect(result).toEqual({ key: 'req-123', status: 'pending', statusToken: TOKEN, emailSent: true })
      expect(deps.repository.save).toHaveBeenCalledTimes(1)

      const saved = deps.repository.save.mock.calls[0][0]
      expect(saved.status).toBe('pending')
      expect(saved.firstname).toBe('Max')
      expect(saved.email).toBe('max@example.com')
      expect(saved.immatriculation).toBe('HB-ABC')
      expect(saved.reviewedBy).toBeUndefined()
    })

    it('notifies the admin with the saved request including its key, and sends the pilot a receipt', async () => {
      const deps = createMockDeps()
      await submitRequest(deps, validInput, NOW)

      expect(deps.notifier.notifyRequestSubmitted).toHaveBeenCalledTimes(1)
      const [request, adminEmail] = deps.notifier.notifyRequestSubmitted.mock.calls[0]
      expect(request.key).toBe('req-123')
      expect(request.firstname).toBe('Max')
      expect(adminEmail).toBe('admin@aero.ch')
      expect(deps.notifier.notifyRequestReceived).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'req-123', status: 'pending', email: 'max@example.com' }), TOKEN
      )
      expect(deps.notifier.notifyRequestReviewed).not.toHaveBeenCalled()
    })

    it('warns when no notification address is set, and still sends the receipt', async () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
      const deps = createMockDeps({ adminEmail: null })

      await submitRequest(deps, validInput, NOW)

      expect(deps.notifier.notifyRequestSubmitted).not.toHaveBeenCalled()
      expect(warn).toHaveBeenCalledWith('No PPR notification address is set, request not announced:', 'req-123')
      expect(deps.notifier.notifyRequestReceived).toHaveBeenCalledTimes(1)
      warn.mockRestore()
    })
  })

  describe('status token', () => {
    it('is saved with the request as a hash only, with the time it was issued', async () => {
      const deps = createMockDeps()
      await submitRequest(deps, validInput, NOW)

      const saved = deps.repository.save.mock.calls[0][0]
      expect(saved.statusTokens).toEqual({ [HASH]: NOW })
      expect(JSON.stringify(saved)).not.toContain(TOKEN)
    })

    it('reaches the pilot\'s email as an argument of its own, not with the request', async () => {
      const deps = createMockDeps()
      await submitRequest(deps, validInput, NOW)

      const [request, token] = deps.notifier.notifyRequestReceived.mock.calls[0]
      expect(token).toBe(TOKEN)
      expect(JSON.stringify(request)).not.toContain(TOKEN)
      expect(JSON.stringify(deps.notifier.notifyRequestSubmitted.mock.calls[0])).not.toContain(TOKEN)
    })

    it('is not created for invalid input', async () => {
      const deps = createMockDeps()

      await expect(submitRequest(deps, { ...validInput, plannedTime: '25:00' }, NOW)).rejects.toThrow()
      expect(deps.statusTokens.create).not.toHaveBeenCalled()
    })
  })

  describe('without login', () => {
    const withoutLogin = { ...validInput, createdBy: undefined, email: 'Max@Example.com', withoutLogin: true }

    it('saves a request that is marked and belongs to no login', async () => {
      const deps = createMockDeps()
      const result = await submitRequest(deps, withoutLogin, NOW)

      expect(result).toEqual({ key: 'req-123', status: 'pending', statusToken: TOKEN, emailSent: true })
      const saved = deps.repository.save.mock.calls[0][0]
      expect(saved.withoutLogin).toBe(true)
      expect(saved).not.toHaveProperty('createdBy')
      expect(saved.email).toBe('max@example.com')
    })

    it('sends the receipt to the address given, and the admin the marked request', async () => {
      const deps = createMockDeps()
      await submitRequest(deps, withoutLogin, NOW)

      expect(deps.notifier.notifyRequestReceived).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'max@example.com', withoutLogin: true }), TOKEN
      )
      expect(deps.notifier.notifyRequestSubmitted).toHaveBeenCalledWith(
        expect.objectContaining({ withoutLogin: true }), 'admin@aero.ch'
      )
    })

    it('is answered automatically as configured', async () => {
      const deps = createMockDeps({ answerSettings: { answerMode: 'automatic', pilotInfo: 'Runway 05/23' } })
      const result = await submitRequest(deps, withoutLogin, NOW)

      expect(result).toEqual({ key: 'req-123', status: 'approved', reviewRemarks: 'Runway 05/23', statusToken: TOKEN, emailSent: true })
    })
  })

  describe('automatic answers', () => {
    const automatic = { answerMode: 'automatic', pilotInfo: 'Runway 05/23, landing fee CHF 20' }

    it('saves the request approved with the information for pilots', async () => {
      const deps = createMockDeps({ answerSettings: automatic })
      const result = await submitRequest(deps, validInput, NOW)

      expect(result).toEqual({
        key: 'req-123', status: 'approved', reviewRemarks: 'Runway 05/23, landing fee CHF 20', statusToken: TOKEN,
        emailSent: true
      })
      expect(deps.repository.save.mock.calls[0][0]).toEqual(expect.objectContaining({
        status: 'approved',
        reviewedBy: 'automatic',
        reviewedAt: NOW,
        reviewRemarks: 'Runway 05/23, landing fee CHF 20',
        statusTokens: { [HASH]: NOW }
      }))
    })

    it('sends the pilot the approval with the status token instead of a receipt, and the admin the request', async () => {
      const deps = createMockDeps({ answerSettings: automatic })
      await submitRequest(deps, validInput, NOW)

      expect(deps.notifier.notifyRequestReviewed).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'req-123', status: 'approved', email: 'max@example.com' }), TOKEN
      )
      expect(deps.notifier.notifyRequestReceived).not.toHaveBeenCalled()
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

      expect(result).toEqual({ key: 'req-123', status: 'approved', statusToken: TOKEN, emailSent: true })
      expect(deps.repository.save.mock.calls[0][0].reviewRemarks).toBeUndefined()
    })
  })

  describe('closed aerodrome', () => {
    it('rejects a request within a closure with its reason, also with manual answers', async () => {
      const deps = createMockDeps({
        answerSettings: { closures: { 0: { from: '2026-04-14', to: '2026-04-16', reason: 'Runway works' } } }
      })
      const result = await submitRequest(deps, validInput, NOW)

      expect(result).toEqual({ key: 'req-123', status: 'rejected', reviewRemarks: 'Runway works', statusToken: TOKEN, emailSent: true })
      expect(deps.repository.save.mock.calls[0][0]).toEqual(expect.objectContaining({
        status: 'rejected', reviewedBy: 'automatic', reviewRemarks: 'Runway works'
      }))
      expect(deps.notifier.notifyRequestReviewed).toHaveBeenCalledWith(expect.objectContaining({ status: 'rejected' }), TOKEN)
      expect(deps.notifier.notifyRequestReceived).not.toHaveBeenCalled()
    })

    it('rejects a request for today while the aerodrome status is closed', async () => {
      const deps = createMockDeps({ aerodromeStatus: { status: 'closed', details: 'Thunderstorms' } })
      const result = await submitRequest(deps, { ...validInput, plannedDate: '2026-04-01' }, NOW)

      expect(result).toEqual({ key: 'req-123', status: 'rejected', reviewRemarks: 'Thunderstorms', statusToken: TOKEN, emailSent: true })
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

  it('propagates repository errors, without emails', async () => {
    const deps = createMockDeps()
    deps.repository.save.mockRejectedValue(new Error('DB error'))

    await expect(submitRequest(deps, validInput, NOW)).rejects.toThrow('DB error')
    expect(deps.notifier.notifyRequestReceived).not.toHaveBeenCalled()
  })

  it('succeeds even when the notifications fail', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => undefined)
    const deps = createMockDeps({ answerSettings: { answerMode: 'automatic' } })
    deps.notifier.notifyRequestSubmitted.mockRejectedValue(new Error('SMTP down'))
    deps.notifier.notifyRequestReviewed.mockImplementation(() => { throw new Error('SMTP down') })

    const result = await submitRequest(deps, validInput, NOW)
    expect(result).toEqual({ key: 'req-123', status: 'approved', statusToken: TOKEN, emailSent: false })
    expect(error).toHaveBeenCalledTimes(2)
    error.mockRestore()
  })

  it('tells that the pilot\'s email was sent also when the aerodrome\'s fails', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => undefined)
    const deps = createMockDeps()
    deps.notifier.notifyRequestSubmitted.mockRejectedValue(new Error('SMTP down'))

    const result = await submitRequest(deps, validInput, NOW)

    expect(result.emailSent).toBe(true)
    expect(error).toHaveBeenCalledWith('Failed to send PPR notification for request', 'req-123')
    error.mockRestore()
  })

  it('succeeds even when the receipt fails, tells so, and logs only the key', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => undefined)
    const deps = createMockDeps()
    deps.notifier.notifyRequestReceived.mockRejectedValue(new Error('SMTP down'))

    const result = await submitRequest(deps, validInput, NOW)

    expect(result).toEqual({ key: 'req-123', status: 'pending', statusToken: TOKEN, emailSent: false })
    expect(error).toHaveBeenCalledWith('Failed to send the PPR receipt for request', 'req-123')
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
    await expect(submitted).resolves.toEqual({ key: 'req-123', status: 'approved', statusToken: TOKEN, emailSent: true })
  })
})
