'use strict'

const { pprRequestAdminUrl } = require('./adminLinks')

const ORIGIN = 'https://lspl-test.web.app'

// The query of a hash-routing link ('#/admin?a=b' -> 'a=b')
const hashQuery = url => new URLSearchParams(new URL(url).hash.split('?')[1])

describe('PPR adminLinks', () => {
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
})
