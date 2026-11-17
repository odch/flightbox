'use strict'

const mockSubmitRequest = jest.fn()
const mockGetRequestStatus = jest.fn()
const mockWithdrawRequest = jest.fn()
const mockGetClosures = jest.fn()
jest.mock('./usecases/submitRequest', () => mockSubmitRequest)
jest.mock('./usecases/getRequestStatus', () => mockGetRequestStatus)
jest.mock('./usecases/withdrawRequest', () => mockWithdrawRequest)
jest.mock('./usecases/getClosures', () => mockGetClosures)
jest.mock('./deps', () => ({ repository: {}, notifier: {}, settings: {}, aerodromeStatus: {}, statusTokens: {} }))

const mockClientLimiter = { acquire: jest.fn(), release: jest.fn(), retryAfterMs: jest.fn() }
const mockMailboxLimiter = { acquire: jest.fn(), release: jest.fn(), retryAfterMs: jest.fn() }
const mockMailboxDayLimiter = { acquire: jest.fn(), release: jest.fn(), retryAfterMs: jest.fn() }
jest.mock('./adapters/firebaseRateLimiter', () => ({
  guestClientLimiter: mockClientLimiter,
  guestMailboxLimiter: mockMailboxLimiter,
  guestMailboxDayLimiter: mockMailboxDayLimiter
}))

// The session fbAuth found for a request (null: no valid ID token): a guest
// session unless a test says otherwise
let mockSession
jest.mock('../api/fbAuth', () => ({
  fbAuth: jest.fn((req, res, next) => {
    if (!mockSession) {
      return res.status(401).send('Unauthorized')
    }
    req.fbUserId = mockSession.uid
    req.fbUserEmail = mockSession.email
    req.fbSignInProvider = mockSession.provider === undefined ? 'custom' : mockSession.provider
    return next()
  })
}))

const APP_ORIGINS = ['https://lspl-test.web.app', 'https://lspl-test.firebaseapp.com', 'https://ppr.flugplatz.example']
jest.mock('./deployConfig', () => ({ pprAppOrigins: () => APP_ORIGINS }))
jest.mock('./enabled', () => ({ isPprGuestRequestsEnabled: jest.fn(() => true) }))

const router = require('./publicRoutes')
const deps = require('./deps')

const KEY = '-NxAbC_12'
const TOKEN = 'Ab9_-'.repeat(8) + 'xyz'
const CLIENT_IP = '203.0.113.7'

const pilotFields = {
  firstname: 'Max',
  lastname: 'Muster',
  phone: '+41 79 123 45 67',
  immatriculation: 'HB-ABC',
  aircraftType: 'PA-28',
  mtow: 1100,
  plannedDate: '2026-11-20',
  plannedTime: '10:30',
  flightType: 'private',
  remarks: 'Training',
  language: 'en'
}

// A request as the Functions Framework hands it on: the body parsed (or
// undefined without one), the client's address appended to X-Forwarded-For
function mockReq({ method = 'POST', body, params = {}, headers = {}, contentType = 'application/json' } = {}) {
  const allHeaders = {
    'x-forwarded-for': `6.6.6.6, ${CLIENT_IP}`,
    ...(contentType ? { 'content-type': contentType } : {}),
    ...headers
  }
  return {
    method,
    body,
    params,
    headers: allHeaders,
    socket: { remoteAddress: '169.254.8.129' },
    is(type) {
      return (allHeaders['content-type'] || '').split(';')[0].trim() === type ? type : false
    }
  }
}

function mockRes() {
  const res = {
    statusCode: 200,
    body: null,
    headers: {},
    ended: false,
    status(code) { res.statusCode = code; return res },
    json(data) { res.body = data; return res },
    send(data) { res.body = data; res.ended = true; return res },
    set(name, value) { res.headers[name.toLowerCase()] = value; return res },
    setHeader(name, value) { res.headers[name.toLowerCase()] = value },
    getHeader(name) { return res.headers[name.toLowerCase()] },
    end() { res.ended = true }
  }
  return res
}

const routeOf = (routes, path) => routes.stack.find(layer => layer.route && layer.route.path === path)

function handlersOf(method, path, routes = router) {
  const layer = routeOf(routes, path)
  return layer ? layer.route.stack.filter(s => s.method === method).map(s => s.handle) : null
}

// Runs the handlers like Express; true when the last one called next, i.e.
// the request would go on to the next routes (and their permissive CORS)
async function run(method, path, req, res = mockRes()) {
  const handlers = handlersOf(method, path)
  let passedOn = false
  for (const handler of handlers) {
    passedOn = false
    await handler(req, res, () => { passedOn = true })
    if (!passedOn) break
  }
  return { res, passedOn }
}

const submit = body => run('post', '/guest-requests', mockReq({ body }))

describe('PPR routes without login', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSession = { uid: 'guest' }
    mockClientLimiter.acquire.mockResolvedValue(true)
    mockMailboxLimiter.acquire.mockResolvedValue(true)
    mockMailboxDayLimiter.acquire.mockResolvedValue(true)
    mockClientLimiter.release.mockResolvedValue()
    mockMailboxLimiter.release.mockResolvedValue()
    mockMailboxDayLimiter.release.mockResolvedValue()
  })

  describe('router structure', () => {
    it('has the submission without login, the status routes and the closures, each with its preflight', () => {
      const routes = router.stack.map(layer => [layer.route.path, layer.route.methods])
      expect(routes).toEqual([
        ['/guest-requests', { options: true, post: true }],
        ['/status/:key', { options: true, post: true }],
        ['/status/:key/withdraw', { options: true, post: true }],
        ['/closures', { options: true, get: true }]
      ])
    })

    it('has no submission without login where it is off, but the status routes and the closures', () => {
      let routes
      jest.isolateModules(() => {
        require('./enabled').isPprGuestRequestsEnabled.mockReturnValueOnce(false)
        routes = require('./publicRoutes')
      })

      expect(routeOf(routes, '/guest-requests')).toBeUndefined()
      expect(handlersOf('post', '/status/:key', routes)).toHaveLength(3)
      expect(handlersOf('post', '/status/:key/withdraw', routes)).toHaveLength(3)
      expect(handlersOf('get', '/closures', routes)).toHaveLength(2)
    })
  })

  describe('CORS', () => {
    const PATHS = ['/guest-requests', '/status/:key', '/status/:key/withdraw', '/closures']
    const preflight = (path, origin) => run('options', path, mockReq({
      method: 'OPTIONS',
      contentType: null,
      headers: {
        origin,
        'access-control-request-method': path === '/closures' ? 'GET' : 'POST',
        'access-control-request-headers': 'content-type'
      }
    }))

    const allowed = PATHS.flatMap(path => [
      ...APP_ORIGINS, 'http://localhost:8080', 'http://127.0.0.1:8080', 'http://0.0.0.0:8080'
    ].map(origin => [path, origin]))

    it.each(allowed)('%s allows the app\'s page on %s', async (path, origin) => {
      const { res, passedOn } = await preflight(path, origin)

      expect(res.ended).toBe(true)
      expect(res.statusCode).toBe(204)
      expect(res.headers['access-control-allow-origin']).toBe(origin)
      expect(res.headers['access-control-allow-methods']).toBe('GET,POST')
      // The ID token of the session that submits
      expect(res.headers['access-control-allow-headers']).toBe('Content-Type,Authorization')
      expect(passedOn).toBe(false)
    })

    const foreign = PATHS.flatMap(path => [
      'https://evil.example',
      'https://lspl-test.web.app.evil.example',
      'http://lspl-test.web.app',
      'https://lspl-prod.web.app',
      'http://localhost.evil.example:8080',
      'null'
    ].map(origin => [path, origin]))

    it.each(foreign)('%s answers the preflight of %s itself, without permission', async (path, origin) => {
      const { res, passedOn } = await preflight(path, origin)

      expect(res.ended).toBe(true)
      expect(res.headers['access-control-allow-origin']).toBeUndefined()
      // The permissive CORS of the other routes would allow it
      expect(passedOn).toBe(false)
    })

    it('allows the app\'s page to read the answer', async () => {
      mockSubmitRequest.mockResolvedValue({ key: KEY, status: 'pending', statusToken: TOKEN })
      const req = mockReq({ body: { ...pilotFields, email: 'max@example.com' }, headers: { origin: APP_ORIGINS[0] } })

      const { res } = await run('post', '/guest-requests', req)

      expect(res.statusCode).toBe(201)
      expect(res.headers['access-control-allow-origin']).toBe(APP_ORIGINS[0])
    })

    it('lets the app\'s page read how long to wait after too many requests', async () => {
      const req = mockReq({ body: { ...pilotFields, email: 'max@example.com' }, headers: { origin: APP_ORIGINS[0] } })

      const { res } = await run('post', '/guest-requests', req)

      expect(res.headers['access-control-expose-headers']).toBe('Retry-After')
    })

    it('does not let other sites read the answer', async () => {
      mockGetRequestStatus.mockResolvedValue({ status: 'pending' })
      const req = mockReq({ params: { key: KEY }, body: { token: TOKEN }, headers: { origin: 'https://evil.example' } })

      const { res } = await run('post', '/status/:key', req)

      expect(res.headers['access-control-allow-origin']).toBeUndefined()
    })

    it('allows the app\'s page to read the closures, and no other site', async () => {
      mockGetClosures.mockResolvedValue([])
      const get = origin => run('get', '/closures', mockReq({ method: 'GET', contentType: null, headers: { origin } }))

      expect((await get(APP_ORIGINS[2])).res.headers['access-control-allow-origin']).toBe(APP_ORIGINS[2])
      expect((await get('https://evil.example')).res.headers['access-control-allow-origin']).toBeUndefined()
    })
  })

  describe('JSON only', () => {
    it.each([
      ['/guest-requests', {}],
      ['/status/:key', { key: KEY }],
      ['/status/:key/withdraw', { key: KEY }]
    ])('%s refuses other content (a form any site can post) with 415', async (path, params) => {
      for (const contentType of ['application/x-www-form-urlencoded', 'text/plain', 'multipart/form-data', null]) {
        const { res } = await run('post', path, mockReq({ params, body: { token: TOKEN }, contentType }))
        expect(res.statusCode).toBe(415)
      }
      expect(mockSubmitRequest).not.toHaveBeenCalled()
      expect(mockGetRequestStatus).not.toHaveBeenCalled()
      expect(mockWithdrawRequest).not.toHaveBeenCalled()
      expect(mockClientLimiter.acquire).not.toHaveBeenCalled()
    })

    it('takes JSON with a charset', async () => {
      mockGetRequestStatus.mockResolvedValue({ status: 'pending' })
      const req = mockReq({ params: { key: KEY }, body: { token: TOKEN }, contentType: 'application/json; charset=utf-8' })

      const { res } = await run('post', '/status/:key', req)

      expect(res.statusCode).toBe(200)
    })
  })

  describe('POST /guest-requests', () => {
    it('submits the request without login and returns its status token', async () => {
      mockSubmitRequest.mockResolvedValue({ key: KEY, status: 'pending', statusToken: TOKEN })

      const { res } = await submit({ ...pilotFields, email: 'max@example.com' })

      expect(res.statusCode).toBe(201)
      expect(res.body).toEqual({ key: KEY, status: 'pending', statusToken: TOKEN })
      expect(mockSubmitRequest).toHaveBeenCalledWith(deps, { ...pilotFields, email: 'max@example.com', withoutLogin: true })
    })

    it('returns an answer given on submission', async () => {
      mockSubmitRequest.mockResolvedValue({ key: KEY, status: 'approved', reviewRemarks: 'Runway 05/23', statusToken: TOKEN })

      const { res } = await submit({ ...pilotFields, email: 'max@example.com' })

      expect(res.body).toEqual({ key: KEY, status: 'approved', reviewRemarks: 'Runway 05/23', statusToken: TOKEN })
    })

    it('takes the address lower-cased', async () => {
      mockSubmitRequest.mockResolvedValue({ key: KEY, status: 'pending', statusToken: TOKEN })

      await submit({ ...pilotFields, email: ' Max.Muster@Example.CH ' })

      expect(mockSubmitRequest.mock.calls[0][1].email).toBe('max.muster@example.ch')
    })

    it('takes only what a pilot fills in: never the owner, status or mark from the body', async () => {
      mockSubmitRequest.mockResolvedValue({ key: KEY, status: 'pending', statusToken: TOKEN })

      await submit({
        ...pilotFields,
        email: 'max@example.com',
        createdBy: 'victim@example.com',
        withoutLogin: false,
        status: 'approved',
        reviewedBy: 'automatic',
        statusTokens: { [TOKEN]: 1 }
      })

      expect(mockSubmitRequest.mock.calls[0][1]).toEqual({ ...pilotFields, email: 'max@example.com', withoutLogin: true })
    })

    it('ignores a login: kiosk and guest sessions get no other treatment', async () => {
      mockSubmitRequest.mockResolvedValue({ key: KEY, status: 'pending', statusToken: TOKEN })
      const req = mockReq({ body: { ...pilotFields, email: 'max@example.com' }, headers: { authorization: 'Bearer kiosk-token' } })

      const { res } = await run('post', '/guest-requests', req)

      expect(res.statusCode).toBe(201)
      expect(mockSubmitRequest.mock.calls[0][1]).not.toHaveProperty('createdBy')
    })

    it.each([
      ['a display name', 'Max <max@example.com>'],
      ['a second recipient', 'max@example.com,victim@example.com'],
      ['quotes', '"max"@example.com'],
      ['a space', 'max muster@example.com'],
      ['no address', undefined],
      ['no string', ['max@example.com']]
    ])('refuses %s with 400, before the limits count it', async (name, email) => {
      const { res } = await submit({ ...pilotFields, email })

      expect(res.statusCode).toBe(400)
      expect(res.body).toEqual({ error: 'Invalid email format' })
      expect(mockClientLimiter.acquire).not.toHaveBeenCalled()
      expect(mockMailboxLimiter.acquire).not.toHaveBeenCalled()
      expect(mockSubmitRequest).not.toHaveBeenCalled()
    })

    it('answers 400 for an empty body', async () => {
      const { res } = await submit(undefined)

      expect(res.statusCode).toBe(400)
      expect(mockSubmitRequest).not.toHaveBeenCalled()
    })

    describe('session', () => {
      it('is needed: without a valid ID token the request is refused before anything else', async () => {
        mockSession = null

        const { res } = await submit({ ...pilotFields, email: 'max@example.com' })

        expect(res.statusCode).toBe(401)
        expect(mockClientLimiter.acquire).not.toHaveBeenCalled()
        expect(mockSubmitRequest).not.toHaveBeenCalled()
      })

      it.each([
        ['the kiosk', { uid: 'kiosk' }],
        ['a login with an email address, which requests with it', { uid: 'u1', email: 'pilot@example.com' }],
        // e.g. a password set on the shared user 'guest', which would outlive
        // a renewal of the guest access token
        ['the user \'guest\' signed in with a password', { uid: 'guest', provider: 'password' }],
        ['an anonymous session', { uid: 'anon-1', provider: 'anonymous' }],
      ])('refuses %s', async (name, session) => {
        mockSession = session

        const { res } = await submit({ ...pilotFields, email: 'max@example.com' })

        expect(res.statusCode).toBe(403)
        expect(mockClientLimiter.acquire).not.toHaveBeenCalled()
        expect(mockSubmitRequest).not.toHaveBeenCalled()
      })

      it.each([
        ['a guest session', { uid: 'guest' }],
        // All guest sessions share it: an address set on it must not shut
        // every guest out
        ['a guest session whose shared user has an email address', { uid: 'guest', email: 'x@attacker.example' }],
        ['a login without an email address', { uid: 'u1' }],
      ])('takes %s', async (name, session) => {
        mockSession = session
        mockSubmitRequest.mockResolvedValue({ key: KEY, status: 'pending', statusToken: TOKEN, emailSent: true })

        const { res } = await submit({ ...pilotFields, email: 'max@example.com' })

        expect(res.statusCode).toBe(201)
        expect(mockSubmitRequest.mock.calls[0][1]).toEqual({ ...pilotFields, email: 'max@example.com', withoutLogin: true })
      })

      it('is not needed for the status of a request', async () => {
        mockSession = null
        const { fbAuth } = require('../api/fbAuth')

        await run('post', '/status/:key', mockReq({ params: { key: KEY }, body: { token: TOKEN } }))

        expect(fbAuth).not.toHaveBeenCalled()
      })
    })

    describe('limits', () => {
      it('count the client by the address Google appended, then the mailbox per day and per hour', async () => {
        mockSubmitRequest.mockResolvedValue({ key: KEY, status: 'pending', statusToken: TOKEN })

        const { res } = await submit({ ...pilotFields, email: 'P.ilot+ppr@gmail.com' })

        expect(res.statusCode).toBe(201)
        expect(mockClientLimiter.acquire).toHaveBeenCalledWith(CLIENT_IP)
        expect(mockMailboxLimiter.acquire).toHaveBeenCalledWith('pilot@gmail.com')
        expect(mockMailboxDayLimiter.acquire).toHaveBeenCalledWith('pilot@gmail.com')
        expect(mockClientLimiter.acquire.mock.invocationCallOrder[0])
          .toBeLessThan(mockMailboxDayLimiter.acquire.mock.invocationCallOrder[0])
        expect(mockMailboxDayLimiter.acquire.mock.invocationCallOrder[0])
          .toBeLessThan(mockMailboxLimiter.acquire.mock.invocationCallOrder[0])
        expect(mockClientLimiter.release).not.toHaveBeenCalled()
        expect(mockMailboxLimiter.release).not.toHaveBeenCalled()
        expect(mockMailboxDayLimiter.release).not.toHaveBeenCalled()
      })

      it('refuse a client at its limit with 429 and when to retry, without touching the mailbox\'s', async () => {
        mockClientLimiter.acquire.mockResolvedValue(false)
        mockClientLimiter.retryAfterMs.mockResolvedValue(90500)

        const { res } = await submit({ ...pilotFields, email: 'max@example.com' })

        expect(res.statusCode).toBe(429)
        expect(res.body).toEqual({ error: 'Too many requests' })
        expect(res.headers['retry-after']).toBe('91')
        expect(mockClientLimiter.retryAfterMs).toHaveBeenCalledWith(CLIENT_IP)
        expect(mockMailboxLimiter.acquire).not.toHaveBeenCalled()
        expect(mockClientLimiter.release).not.toHaveBeenCalled()
        expect(mockSubmitRequest).not.toHaveBeenCalled()
      })

      it('refuse a mailbox at its hourly limit with the same answer, and give the other slots back', async () => {
        mockMailboxLimiter.acquire.mockResolvedValue(false)
        mockMailboxLimiter.retryAfterMs.mockResolvedValue(1800000)

        const { res } = await submit({ ...pilotFields, email: 'max@example.com' })

        expect(res.statusCode).toBe(429)
        expect(res.body).toEqual({ error: 'Too many requests' })
        expect(res.headers['retry-after']).toBe('1800')
        expect(mockClientLimiter.release).toHaveBeenCalledWith(CLIENT_IP)
        expect(mockMailboxDayLimiter.release).toHaveBeenCalledWith('max@example.com')
        expect(mockMailboxLimiter.release).not.toHaveBeenCalled()
        expect(mockSubmitRequest).not.toHaveBeenCalled()
      })

      it('refuse a mailbox at its daily limit with the same answer and the day\'s wait, before the hour\'s', async () => {
        mockMailboxDayLimiter.acquire.mockResolvedValue(false)
        mockMailboxDayLimiter.retryAfterMs.mockResolvedValue(20 * 60 * 60 * 1000)

        const { res } = await submit({ ...pilotFields, email: 'max@example.com' })

        expect(res.statusCode).toBe(429)
        expect(res.body).toEqual({ error: 'Too many requests' })
        expect(res.headers['retry-after']).toBe('72000')
        expect(mockMailboxDayLimiter.retryAfterMs).toHaveBeenCalledWith('max@example.com')
        expect(mockClientLimiter.release).toHaveBeenCalledWith(CLIENT_IP)
        expect(mockMailboxDayLimiter.release).not.toHaveBeenCalled()
        expect(mockMailboxLimiter.acquire).not.toHaveBeenCalled()
        expect(mockSubmitRequest).not.toHaveBeenCalled()
      })

      it('ask to retry after a second at least', async () => {
        mockClientLimiter.acquire.mockResolvedValue(false)
        mockClientLimiter.retryAfterMs.mockResolvedValue(0)

        const { res } = await submit({ ...pilotFields, email: 'max@example.com' })

        expect(res.headers['retry-after']).toBe('1')
      })

      it('give every slot back when the request is rejected', async () => {
        const err = new Error('Invalid time value')
        err.code = 'INVALID_INPUT'
        mockSubmitRequest.mockRejectedValue(err)

        const { res } = await submit({ ...pilotFields, email: 'max@example.com' })

        expect(res.statusCode).toBe(400)
        expect(res.body).toEqual({ error: 'Invalid time value' })
        expect(mockClientLimiter.release).toHaveBeenCalledWith(CLIENT_IP)
        expect(mockMailboxLimiter.release).toHaveBeenCalledWith('max@example.com')
        expect(mockMailboxDayLimiter.release).toHaveBeenCalledWith('max@example.com')
      })

      it('give every slot back when the submission fails', async () => {
        const error = jest.spyOn(console, 'error').mockImplementation(() => undefined)
        mockSubmitRequest.mockRejectedValue(new Error('DB down'))

        const { res } = await submit({ ...pilotFields, email: 'max@example.com' })

        expect(res.statusCode).toBe(500)
        expect(res.body).toEqual({ error: 'Failed to submit request' })
        expect(mockClientLimiter.release).toHaveBeenCalledTimes(1)
        expect(mockMailboxLimiter.release).toHaveBeenCalledTimes(1)
        expect(mockMailboxDayLimiter.release).toHaveBeenCalledTimes(1)
        expect(JSON.stringify(error.mock.calls)).not.toMatch(/max@example\.com|203\.0\.113\.7/)
        error.mockRestore()
      })

      it('give the slots held back when the mailbox\'s hourly one cannot be read', async () => {
        const error = jest.spyOn(console, 'error').mockImplementation(() => undefined)
        mockMailboxLimiter.acquire.mockRejectedValue(new Error('DB down'))

        const { res } = await submit({ ...pilotFields, email: 'max@example.com' })

        expect(res.statusCode).toBe(500)
        expect(mockClientLimiter.release).toHaveBeenCalledTimes(1)
        expect(mockMailboxDayLimiter.release).toHaveBeenCalledTimes(1)
        expect(mockMailboxLimiter.release).not.toHaveBeenCalled()
        error.mockRestore()
      })

      it('keep the answer when a slot cannot be given back', async () => {
        const err = new Error('Invalid date')
        err.code = 'INVALID_INPUT'
        mockSubmitRequest.mockRejectedValue(err)
        mockClientLimiter.release.mockRejectedValue(new Error('DB down'))

        const { res } = await submit({ ...pilotFields, email: 'max@example.com' })

        expect(res.statusCode).toBe(400)
        expect(mockMailboxLimiter.release).toHaveBeenCalledTimes(1)
        expect(mockMailboxDayLimiter.release).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('POST /status/:key', () => {
    const statusReq = (params, body) => mockReq({ params, body })

    it('returns the status for the token of the link', async () => {
      const view = { status: 'pending', immatriculation: 'HB-ABC', automatic: false, canWithdraw: true }
      mockGetRequestStatus.mockResolvedValue(view)

      const { res } = await run('post', '/status/:key', statusReq({ key: KEY }, { token: TOKEN }))

      expect(res.statusCode).toBe(200)
      expect(res.body).toEqual(view)
      expect(mockGetRequestStatus).toHaveBeenCalledWith(deps, KEY, TOKEN)
    })

    it('answers 404 for a missing request or a wrong token', async () => {
      const err = new Error('PPR request not found')
      err.code = 'NOT_FOUND'
      mockGetRequestStatus.mockRejectedValue(err)

      const { res } = await run('post', '/status/:key', statusReq({ key: KEY }, { token: TOKEN }))

      expect(res.statusCode).toBe(404)
      expect(res.body).toEqual({ error: 'Not found' })
    })

    it.each([
      ['a key of another form', { key: 'a.b' }, { token: TOKEN }],
      ['a token of another form', { key: KEY }, { token: TOKEN.slice(1) }],
      ['a token that is no string', { key: KEY }, { token: [TOKEN] }],
      ['no token', { key: KEY }, {}],
      ['no body', { key: KEY }, undefined]
    ])('answers 404 for %s, as for a wrong token', async (name, params, body) => {
      const { res } = await run('post', '/status/:key', statusReq(params, body))

      expect(res.statusCode).toBe(404)
      expect(res.body).toEqual({ error: 'Not found' })
      expect(mockGetRequestStatus).not.toHaveBeenCalled()
    })

    it('answers 500 when the status cannot be read, and logs only the key', async () => {
      const error = jest.spyOn(console, 'error').mockImplementation(() => undefined)
      mockGetRequestStatus.mockRejectedValue(new Error('DB down'))

      const { res } = await run('post', '/status/:key', statusReq({ key: KEY }, { token: TOKEN }))

      expect(res.statusCode).toBe(500)
      expect(error).toHaveBeenCalledWith('Failed to read the status of PPR request', KEY)
      expect(JSON.stringify(error.mock.calls)).not.toContain(TOKEN)
      error.mockRestore()
    })
  })

  describe('POST /status/:key/withdraw', () => {
    const withdrawReq = (params, body) => mockReq({ params, body })

    it('withdraws the request for the token of the link', async () => {
      mockWithdrawRequest.mockResolvedValue()

      const { res } = await run('post', '/status/:key/withdraw', withdrawReq({ key: KEY }, { token: TOKEN }))

      expect(res.statusCode).toBe(200)
      expect(res.body).toEqual({ withdrawn: true })
      expect(mockWithdrawRequest).toHaveBeenCalledWith(deps, KEY, TOKEN)
    })

    it.each([
      ['NOT_FOUND', 404, { error: 'Not found' }],
      ['NOT_PENDING', 409, { error: 'Not pending' }]
    ])('maps %s to %i', async (code, status, body) => {
      const err = new Error('withdraw failed')
      err.code = code
      mockWithdrawRequest.mockRejectedValue(err)

      const { res } = await run('post', '/status/:key/withdraw', withdrawReq({ key: KEY }, { token: TOKEN }))

      expect(res.statusCode).toBe(status)
      expect(res.body).toEqual(body)
    })

    it.each([
      ['a key of another form', { key: '../../etc' }, { token: TOKEN }],
      ['a token of another form', { key: KEY }, { token: `${TOKEN}=` }],
      ['no body', { key: KEY }, undefined]
    ])('answers 404 for %s', async (name, params, body) => {
      const { res } = await run('post', '/status/:key/withdraw', withdrawReq(params, body))

      expect(res.statusCode).toBe(404)
      expect(mockWithdrawRequest).not.toHaveBeenCalled()
    })

    it('answers 500 when the request cannot be withdrawn, and logs only the key', async () => {
      const error = jest.spyOn(console, 'error').mockImplementation(() => undefined)
      mockWithdrawRequest.mockRejectedValue(new Error('DB down'))

      const { res } = await run('post', '/status/:key/withdraw', withdrawReq({ key: KEY }, { token: TOKEN }))

      expect(res.statusCode).toBe(500)
      expect(res.body).toEqual({ error: 'Failed to withdraw request' })
      expect(error).toHaveBeenCalledWith('Failed to withdraw PPR request', KEY)
      error.mockRestore()
    })
  })

  describe('GET /closures', () => {
    const closuresReq = () => mockReq({ method: 'GET', contentType: null })

    it('returns the closures that have not ended, without login', async () => {
      mockSession = null
      const closures = [{ from: '2026-11-20', to: '2026-11-22', reason: 'Runway works' }]
      mockGetClosures.mockResolvedValue(closures)

      const { res, passedOn } = await run('get', '/closures', closuresReq())

      expect(res.statusCode).toBe(200)
      expect(res.body).toEqual({ closures })
      expect(mockGetClosures).toHaveBeenCalledWith(deps)
      expect(passedOn).toBe(false)
    })

    it('answers 500 when the closures cannot be read', async () => {
      const error = jest.spyOn(console, 'error').mockImplementation(() => undefined)
      mockGetClosures.mockRejectedValue(new Error('DB down'))

      const { res } = await run('get', '/closures', closuresReq())

      expect(res.statusCode).toBe(500)
      expect(res.body).toEqual({ error: 'Failed to read closures' })
      expect(error).toHaveBeenCalledWith('Failed to read the PPR closures')
      error.mockRestore()
    })
  })
})
