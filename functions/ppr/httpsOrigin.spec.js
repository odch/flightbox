'use strict'

const { httpsOrigin } = require('./httpsOrigin')

describe('PPR httpsOrigin', () => {
  it.each([
    ['https://lspl-test.web.app', 'https://lspl-test.web.app'],
    ['https://lspl-test.web.app/', 'https://lspl-test.web.app'],
    ['https://LSPL-test.web.app', 'https://lspl-test.web.app'],
    ['https://flightbox.example:443', 'https://flightbox.example'],
    ['https://flightbox.example:8443/', 'https://flightbox.example:8443']
  ])('returns the origin of %p', (value, origin) => {
    expect(httpsOrigin(value)).toBe(origin)
  })

  it.each([
    ['http', 'http://lspl-test.web.app'],
    ['another scheme', 'ftp://lspl-test.web.app'],
    ['a script', 'javascript:alert(1)'],
    ['a user', 'https://admin@lspl-test.web.app'],
    ['credentials', 'https://admin:secret@lspl-test.web.app'],
    ['a path', 'https://lspl-test.web.app/app'],
    ['a query', 'https://lspl-test.web.app/?tab=ppr'],
    ['an empty query', 'https://lspl-test.web.app/?'],
    ['a fragment', 'https://lspl-test.web.app/#/admin'],
    ['an empty fragment', 'https://lspl-test.web.app/#'],
    ['no host', 'https://'],
    ['no URL', 'lspl-test.web.app'],
    ['an empty string', ''],
    ['no string', 42],
    ['nothing', undefined]
  ])('refuses a value with %s', (name, value) => {
    expect(httpsOrigin(value)).toBeNull()
  })
})
