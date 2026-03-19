'use strict'

const mockVerifyIdToken = jest.fn()
const mockAdminDbOnce = jest.fn()
const mockAdminDbRef = jest.fn(() => ({ once: mockAdminDbOnce }))

jest.mock('firebase-admin', () => ({
  auth: jest.fn(() => ({ verifyIdToken: mockVerifyIdToken })),
  database: jest.fn(() => ({ ref: mockAdminDbRef }))
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

    it('returns 400 on validation error', async () => {
      authenticateAs('uid-1', 'pilot@example.com')
      setupAdminDbRef(null, 'admin@aero.ch')
      mockSubmitRequest.mockRejectedValue(new Error('Missing required fields: email'))

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

    it('calls listRequests with isAdmin from server check', async () => {
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
      const callArgs = mockListRequests.mock.calls[0]
      expect(callArgs[1].isAdmin).toBe(true)
    })

    it('passes isAdmin=false for non-admin', async () => {
      authenticateAs('uid-1', 'pilot@example.com')
      setupAdminDbRef('uid-other')
      mockListRequests.mockResolvedValue([])

      const req = mockReq({
        headers: { authorization: 'Bearer valid-token' }
      })
      const res = mockRes()

      await runMiddlewareChain(handlers, req, res)

      const callArgs = mockListRequests.mock.calls[0]
      expect(callArgs[1].isAdmin).toBe(false)
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
  })
})
