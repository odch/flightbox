'use strict'

const { pprRequestAdminUrl, pprRequestStatusUrl } = require('./adminLinks')

const ORIGIN = 'https://lspl-test.web.app'

// The query of a hash-routing link ('#/admin?a=b' -> 'a=b')
const hashQuery = url => new URLSearchParams(new URL(url).hash.split('?')[1])

describe('PPR links into the app', () => {
  describe('pprRequestAdminUrl', () => {
    it('links to the request in the PPR tab of the admin area', () => {
      expect(pprRequestAdminUrl(ORIGIN, '-NxAbC_12')).toBe(`${ORIGIN}/#/admin?tab=ppr&request=-NxAbC_12`)
    })

    it('has the tab and the request as the only parameters, not the guest token', () => {
      const url = new URL(pprRequestAdminUrl(ORIGIN, '-NxAbC_12'))
      expect(url.search).toBe('')
      expect(url.hash.startsWith('#/admin?')).toBe(true)
      expect([...hashQuery(url.href).entries()]).toEqual([['tab', 'ppr'], ['request', '-NxAbC_12']])
      expect(hashQuery(url.href).has('t')).toBe(false)
    })

    it('accepts keys of up to 128 characters', () => {
      const key = 'k'.repeat(128)
      expect(hashQuery(pprRequestAdminUrl(ORIGIN, key)).get('request')).toBe(key)
    })

    it.each([null, undefined, ''])('has no link without the app origin %p', origin => {
      expect(pprRequestAdminUrl(origin, '-NxAbC_12')).toBeNull()
    })

    it.each([
      ['a path', '../../etc'],
      ['a slash', 'a/b'],
      ['a query', 'a?b=c'],
      ['a fragment', 'a#b'],
      ['an ampersand', 'a&t=00000000-0000-0000-0000-000000000000'],
      ['a space', 'a b'],
      ['a quote', 'a"b'],
      ['too many characters', 'k'.repeat(129)],
      ['no characters', ''],
      ['no string', 123],
      ['nothing', undefined],
      ['null', null]
    ])('has no link for a key with %s', (name, key) => {
      expect(pprRequestAdminUrl(ORIGIN, key)).toBeNull()
    })
  })

  describe('pprRequestStatusUrl', () => {
    const TOKEN = 'Ab9_-'.repeat(8) + 'xyz'

    it('links to the status page with the key and the token as path segments', () => {
      expect(pprRequestStatusUrl(ORIGIN, '-NxAbC_12', TOKEN)).toBe(`${ORIGIN}/#/ppr/status/-NxAbC_12/${TOKEN}`)
    })

    it('keeps the token out of the server\'s sight and has no parameters', () => {
      const url = new URL(pprRequestStatusUrl(ORIGIN, '-NxAbC_12', TOKEN))
      expect(url.pathname).toBe('/')
      expect(url.search).toBe('')
      expect(url.hash).toBe(`#/ppr/status/-NxAbC_12/${TOKEN}`)
      expect(url.hash).not.toContain('?')
    })

    it.each([null, undefined, ''])('has no link without the app origin %p', origin => {
      expect(pprRequestStatusUrl(origin, '-NxAbC_12', TOKEN)).toBeNull()
    })

    it.each([
      ['a path', '../../etc'],
      ['a slash', 'a/b'],
      ['a query', 'a?t=00000000-0000-0000-0000-000000000000'],
      ['too many characters', 'k'.repeat(129)],
      ['no characters', ''],
      ['nothing', undefined]
    ])('has no link for a key with %s', (name, key) => {
      expect(pprRequestStatusUrl(ORIGIN, key, TOKEN)).toBeNull()
    })

    it.each([
      ['42 characters', 'a'.repeat(42)],
      ['44 characters', 'a'.repeat(44)],
      ['a slash', 'a'.repeat(42) + '/'],
      ['a query', 'a'.repeat(40) + '?t=x'],
      ['no string', 42],
      ['nothing', undefined]
    ])('has no link for a token with %s', (name, token) => {
      expect(pprRequestStatusUrl(ORIGIN, '-NxAbC_12', token)).toBeNull()
    })
  })
})
