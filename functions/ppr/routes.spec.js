'use strict'

const mockVerifyIdToken = jest.fn()
const mockAdminDbOnce = jest.fn()
const mockAdminDbRef = jest.fn(() => ({ once: mockAdminDbOnce }))

jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn(() => ({ verifyIdToken: mockVerifyIdToken }))
}))
jest.mock('firebase-admin/database', () => ({
  getDatabase: jest.fn(() => ({ ref: mockAdminDbRef }))
}))

const mockSubmitRequest = jest.fn()
const mockReviewRequest = jest.fn()
const mockListRequests = jest.fn()
const mockDeleteRequest = jest.fn()

jest.mock('./usecases/submitRequest', () => mockSubmitRequest)
jest.mock('./usecases/reviewRequest', () => mockReviewRequest)
jest.mock('./usecases/listRequests', () => mockListRequests)
jest.mock('./usecases/deleteRequest', () => mockDeleteRequest)
jest.mock('./adapters/firebasePprRepository', () => ({}))
jest.mock('./adapters/emailNotifier', () => ({}))
const mockAcquire = jest.fn()
const mockRelease = jest.fn()
jest.mock('./adapters/firebaseRateLimiter', () => ({ acquire: mockAcquire, release: mockRelease }))

const router = require('./routes')

// Minimal Express request/response mocks
function mockReq({ method = 'GET', body = {}, params = {}, headers = {} } = {}) {
  return { method, body, params, headers, fbUserId: null, fbUserEmail: null }
}

function mockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) { res.statusCode = code; return res },
    json(data) { res.body = data; return res },
    send(data) { res.body = data; return res }
  }
  return res
}

function authenticateAs(uid, email) {
  mockVerifyIdToken.mockResolvedValue({ uid, email })
}

function setupAdminDbRef(adminUid, pprAdminEmail) {
  mockAdminDbRef.mockImplementation(path => ({
    once: jest.fn().mockResolvedValue({
      val: () => {
        if (path === `/admins/${adminUid}`) return true
        if (path === '/settings/ppr/adminEmail') return pprAdminEmail || 'admin@aero.ch'
        return null
      }
    })
  }))
}

// Extract route handlers from the router stack
function findHandler(method, pathPattern) {
  for (const layer of router.stack) {
    if (layer.route) {
      const routeMethod = Object.keys(layer.route.methods)[0]
      if (routeMethod === method && layer.route.path === pathPattern) {
        return layer.route.stack.map(s => s.handle)
      }
    }
  }
  return null
}

// Run middleware chain — each handler may be sync or async
async function runMiddlewareChain(handlers, req, res) {
  for (let i = 0; i < handlers.length; i++) {
    let called = false
    const next = (err) => {
      if (err) throw err
      called = true
    }
    await handlers[i](req, res, next)
    if (!called) break
  }
}

describe('PPR routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAcquire.mockResolvedValue(true)
    mockRelease.mockResolvedValue()
  })

  describe('router structure', () => {
    it('registers POST /requests', () => {
      expect(findHandler('post', '/requests')).toBeTruthy()
    })

    it('registers GET /requests', () => {
      expect(findHandler('get', '/requests')).toBeTruthy()
    })

    it('registers POST /requests/:key/review', () => {
      expect(findHandler('post', '/requests/:key/review')).toBeTruthy()
    })

    it('registers DELETE /requests/:key', () => {
      expect(findHandler('delete', '/requests/:key')).toBeTruthy()
    })

    it('registers GET /requests/all', () => {
      expect(findHandler('get', '/requests/all')).toBeTruthy()
    })
  })

  describe('POST /requests handler', () => {
    let handlers

    beforeEach(() => {
      handlers = findHandler('post', '/requests')
    })

    it('calls submitRequest and returns 201', async () => {
      authenticateAs('uid-1', 'pilot@example.com')
      setupAdminDbRef(null, 'admin@aero.ch')
      mockSubmitRequest.mockResolvedValue({ key: 'req-123' })

      const req = mockReq({
        headers: { authorization: 'Bearer valid-token' },
        body: { firstname: 'Max' }
      })
      const res = mockRes()

      await runMiddlewareChain(handlers, req, res)

      expect(res.statusCode).toBe(201)
      expect(res.body).toEqual({ key: 'req-123' })
    })

    it('sets createdBy from auth', async () => {
      authenticateAs('uid-1', 'pilot@example.com')
      setupAdminDbRef(null, 'admin@aero.ch')
      mockSubmitRequest.mockResolvedValue({ key: 'req-123' })

      const req = mockReq({
        headers: { authorization: 'Bearer valid-token' },
        body: { firstname: 'Max' }
      })
      const res = mockRes()

      await runMiddlewareChain(handlers, req, res)

      const callArgs = mockSubmitRequest.mock.calls[0]
      expect(callArgs[1].createdBy).toBe('pilot@example.com')
    })

    it('passes the pilot\'s language on for the emails', async () => {
      authenticateAs('uid-1', 'pilot@example.com')
      setupAdminDbRef(null, 'admin@aero.ch')
      mockSubmitRequest.mockResolvedValue({ key: 'req-123' })

      const req = mockReq({
        headers: { authorization: 'Bearer valid-token' },
        body: { firstname: 'Max', language: 'en' }
      })
      const res = mockRes()

      await runMiddlewareChain(handlers, req, res)

      expect(mockSubmitRequest.mock.calls[0][1].language).toBe('en')
    })

    it('returns 400 on validation error', async () => {
      authenticateAs('uid-1', 'pilot@example.com')
      setupAdminDbRef(null, 'admin@aero.ch')
      const err = new Error('Missing required fields: email')
      err.code = 'INVALID_INPUT'
      mockSubmitRequest.mockRejectedValue(err)

      const req = mockReq({
        headers: { authorization: 'Bearer valid-token' },
        body: {}
      })
      const res = mockRes()

      await runMiddlewareChain(handlers, req, res)

      expect(res.statusCode).toBe(400)
      expect(res.body.error).toContain('Missing required fields')
    })

    it('returns 401 without auth', async () => {
      const req = mockReq({ headers: {} })
      const res = mockRes()

      await runMiddlewareChain(handlers, req, res)

      expect(res.statusCode).toBe(401)
    })

    it('returns 429 when the user reached the submission limit', async () => {
      authenticateAs('uid-1', 'pilot@example.com')
      setupAdminDbRef(null, 'admin@aero.ch')
      mockAcquire.mockResolvedValue(false)

      const req = mockReq({ headers: { authorization: 'Bearer valid-token' }, body: { firstname: 'Max' } })
      const res = mockRes()

      await runMiddlewareChain(handlers, req, res)

      expect(res.statusCode).toBe(429)
      expect(mockAcquire).toHaveBeenCalledWith('uid-1')
      expect(mockSubmitRequest).not.toHaveBeenCalled()
    })

    it('gives the slot back when the submission is rejected', async () => {
      authenticateAs('uid-1', 'pilot@example.com')
      setupAdminDbRef(null, 'admin@aero.ch')
      const err = new Error('Invalid date')
      err.code = 'INVALID_INPUT'
      mockSubmitRequest.mockRejectedValue(err)

      const req = mockReq({ headers: { authorization: 'Bearer valid-token' }, body: { firstname: 'Max' } })
      const res = mockRes()

      await runMiddlewareChain(handlers, req, res)

      expect(res.statusCode).toBe(400)
      expect(mockRelease).toHaveBeenCalledWith('uid-1')
    })

    it('keeps the slot for accepted submissions', async () => {
      authenticateAs('uid-1', 'pilot@example.com')
      setupAdminDbRef(null, 'admin@aero.ch')
      mockSubmitRequest.mockResolvedValue({ key: 'req-123' })

      const req = mockReq({ headers: { authorization: 'Bearer valid-token' }, body: { firstname: 'Max' } })
      const res = mockRes()

      await runMiddlewareChain(handlers, req, res)

      expect(res.statusCode).toBe(201)
      expect(mockRelease).not.toHaveBeenCalled()
    })

    it('returns 500 on unexpected error', async () => {
      authenticateAs('uid-1', 'pilot@example.com')
      setupAdminDbRef(null, 'admin@aero.ch')
      mockSubmitRequest.mockRejectedValue(new Error('DB down'))

      const req = mockReq({
        headers: { authorization: 'Bearer valid-token' },
        body: {}
      })
      const res = mockRes()

      await runMiddlewareChain(handlers, req, res)

      expect(res.statusCode).toBe(500)
      expect(res.body.error).toBe('Failed to submit request')
    })
  })

  describe('GET /requests handler', () => {
    let handlers

    beforeEach(() => {
      handlers = findHandler('get', '/requests')
    })

    it('lists only the caller\'s own requests, also for admins', async () => {
      authenticateAs('uid-admin', 'admin@aero.ch')
      setupAdminDbRef('uid-admin')
      mockListRequests.mockResolvedValue([{ key: 'req-1' }])

      const req = mockReq({
        headers: { authorization: 'Bearer valid-token' }
      })
      const res = mockRes()

      await runMiddlewareChain(handlers, req, res)

      expect(res.statusCode).toBe(200)
      expect(res.body).toEqual([{ key: 'req-1' }])
      expect(mockListRequests.mock.calls[0][1]).toEqual({ email: 'admin@aero.ch', isAdmin: false })
    })
  })

  describe('GET /requests/all handler', () => {
    let handlers

    beforeEach(() => {
      handlers = findHandler('get', '/requests/all')
    })

    it('lists all requests for admins', async () => {
      authenticateAs('uid-admin', 'admin@aero.ch')
      setupAdminDbRef('uid-admin')
      mockListRequests.mockResolvedValue([{ key: 'req-1' }, { key: 'req-2' }])

      const req = mockReq({ headers: { authorization: 'Bearer valid-token' } })
      const res = mockRes()

      await runMiddlewareChain(handlers, req, res)

      expect(res.statusCode).toBe(200)
      expect(res.body).toEqual([{ key: 'req-1' }, { key: 'req-2' }])
      expect(mockListRequests.mock.calls[0][1]).toEqual({ isAdmin: true })
    })

    it('refuses non-admins', async () => {
      authenticateAs('uid-1', 'pilot@example.com')
      setupAdminDbRef('uid-other')

      const req = mockReq({ headers: { authorization: 'Bearer valid-token' } })
      const res = mockRes()

      await runMiddlewareChain(handlers, req, res)

      expect(res.statusCode).toBe(403)
      expect(mockListRequests).not.toHaveBeenCalled()
    })
  })

  describe('POST /requests/:key/review handler', () => {
    let handlers

    beforeEach(() => {
      handlers = findHandler('post', '/requests/:key/review')
    })

    it('calls reviewRequest for admin', async () => {
      authenticateAs('uid-admin', 'admin@aero.ch')
      setupAdminDbRef('uid-admin')
      mockReviewRequest.mockResolvedValue()

      const req = mockReq({
        headers: { authorization: 'Bearer valid-token' },
        params: { key: 'req-123' },
        body: { status: 'approved' }
      })
      const res = mockRes()

      await runMiddlewareChain(handlers, req, res)

      expect(res.statusCode).toBe(200)
      expect(mockReviewRequest).toHaveBeenCalled()
    })

    it('returns 404 when not found', async () => {
      authenticateAs('uid-admin', 'admin@aero.ch')
      setupAdminDbRef('uid-admin')
      const err = new Error('PPR request not found')
      err.code = 'NOT_FOUND'
      mockReviewRequest.mockRejectedValue(err)

      const req = mockReq({
        headers: { authorization: 'Bearer valid-token' },
        params: { key: 'req-999' },
        body: { status: 'approved' }
      })
      const res = mockRes()

      await runMiddlewareChain(handlers, req, res)

      expect(res.statusCode).toBe(404)
    })

    it('returns 400 on invalid key format', async () => {
      authenticateAs('uid-admin', 'admin@aero.ch')
      setupAdminDbRef('uid-admin')

      const req = mockReq({
        headers: { authorization: 'Bearer valid-token' },
        params: { key: '../../etc' },
        body: { status: 'approved' }
      })
      const res = mockRes()

      await runMiddlewareChain(handlers, req, res)

      expect(res.statusCode).toBe(400)
      expect(res.body.error).toBe('Invalid request key')
    })
  })

  describe('review errors', () => {
    it.each([['INVALID_INPUT', 400], ['NOT_PENDING', 409], ['NOT_FOUND', 404]])(
      'maps %s to %i', async (code, status) => {
        authenticateAs('uid-admin', 'admin@aero.ch')
        setupAdminDbRef('uid-admin')
        const err = new Error('review failed')
        err.code = code
        mockReviewRequest.mockRejectedValue(err)

        const req = mockReq({
          method: 'POST',
          headers: { authorization: 'Bearer valid-token' },
          params: { key: 'req-123' },
          body: { status: 'approved' }
        })
        const res = mockRes()

        await runMiddlewareChain(findHandler('post', '/requests/:key/review'), req, res)

        expect(res.statusCode).toBe(status)
      }
    )
  })

  describe('DELETE /requests/:key handler', () => {
    let handlers

    beforeEach(() => {
      handlers = findHandler('delete', '/requests/:key')
    })

    it('deletes request for owner', async () => {
      authenticateAs('uid-1', 'pilot@example.com')
      setupAdminDbRef(null)
      mockDeleteRequest.mockResolvedValue()

      const req = mockReq({
        headers: { authorization: 'Bearer valid-token' },
        params: { key: 'req-123' }
      })
      const res = mockRes()

      await runMiddlewareChain(handlers, req, res)

      expect(res.statusCode).toBe(200)
      expect(res.body).toEqual({ success: true })
    })

    it('returns 403 when not owner', async () => {
      authenticateAs('uid-1', 'other@example.com')
      setupAdminDbRef(null)
      const err = new Error('Not authorized')
      err.code = 'FORBIDDEN'
      mockDeleteRequest.mockRejectedValue(err)

      const req = mockReq({
        headers: { authorization: 'Bearer valid-token' },
        params: { key: 'req-123' }
      })
      const res = mockRes()

      await runMiddlewareChain(handlers, req, res)

      expect(res.statusCode).toBe(403)
    })

    it('returns 404 when not found', async () => {
      authenticateAs('uid-1', 'pilot@example.com')
      setupAdminDbRef(null)
      const err = new Error('PPR request not found')
      err.code = 'NOT_FOUND'
      mockDeleteRequest.mockRejectedValue(err)

      const req = mockReq({
        headers: { authorization: 'Bearer valid-token' },
        params: { key: 'req-999' }
      })
      const res = mockRes()

      await runMiddlewareChain(handlers, req, res)

      expect(res.statusCode).toBe(404)
    })

    it('returns 409 when the request is no longer pending', async () => {
      authenticateAs('uid-1', 'pilot@example.com')
      setupAdminDbRef(null)
      const err = new Error('Only pending requests can be deleted')
      err.code = 'NOT_PENDING'
      mockDeleteRequest.mockRejectedValue(err)

      const req = mockReq({
        headers: { authorization: 'Bearer valid-token' },
        params: { key: 'req-123' }
      })
      const res = mockRes()

      await runMiddlewareChain(handlers, req, res)

      expect(res.statusCode).toBe(409)
      expect(res.body).toEqual({ error: 'Only pending requests can be deleted' })
    })
  })

  describe('logins without an email (username/password)', () => {
    const pilotRoutes = [['post', '/requests'], ['get', '/requests'], ['delete', '/requests/:key']]

    it.each(pilotRoutes)('rejects %s %s with 403', async (method, path) => {
      authenticateAs('club-user', undefined)
      setupAdminDbRef(null)

      const req = mockReq({
        method: method.toUpperCase(),
        headers: { authorization: 'Bearer valid-token' },
        params: { key: 'req-123' }
      })
      const res = mockRes()

      await runMiddlewareChain(findHandler(method, path), req, res)

      expect(res.statusCode).toBe(403)
      expect(mockSubmitRequest).not.toHaveBeenCalled()
      expect(mockListRequests).not.toHaveBeenCalled()
      expect(mockDeleteRequest).not.toHaveBeenCalled()
    })

    it('records the uid as reviewer when an admin has no email', async () => {
      authenticateAs('club-admin', undefined)
      setupAdminDbRef('club-admin')
      mockReviewRequest.mockResolvedValue()

      const req = mockReq({
        method: 'POST',
        headers: { authorization: 'Bearer valid-token' },
        params: { key: 'req-123' },
        body: { status: 'approved' }
      })
      const res = mockRes()

      await runMiddlewareChain(findHandler('post', '/requests/:key/review'), req, res)

      expect(res.statusCode).toBe(200)
      expect(mockReviewRequest.mock.calls[0][2].reviewedBy).toBe('club-admin')
    })
  })

  describe('shared sessions (guest / kiosk)', () => {
    const pilotRoutes = [['post', '/requests'], ['get', '/requests'], ['delete', '/requests/:key']]
    const cases = pilotRoutes.flatMap(([method, path]) =>
      ['guest', 'kiosk'].map(uid => [method.toUpperCase(), path, uid]))

    it.each(cases)('rejects %s %s for the %s session with 403', async (method, path, uid) => {
      authenticateAs(uid, undefined)
      setupAdminDbRef(null)

      const req = mockReq({
        method,
        headers: { authorization: 'Bearer valid-token' },
        params: { key: 'req-123' }
      })
      const res = mockRes()

      await runMiddlewareChain(findHandler(method.toLowerCase(), path), req, res)

      expect(res.statusCode).toBe(403)
      expect(mockSubmitRequest).not.toHaveBeenCalled()
      expect(mockListRequests).not.toHaveBeenCalled()
      expect(mockDeleteRequest).not.toHaveBeenCalled()
    })
  })
})
