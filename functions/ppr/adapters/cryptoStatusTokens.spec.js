'use strict'

const crypto = require('crypto')
const { create, matches } = require('./cryptoStatusTokens')
const { STATUS_TOKEN_PATTERN } = require('../domain/pprStatusLink')

const sha256 = value => crypto.createHash('sha256').update(value).digest('hex')

describe('cryptoStatusTokens', () => {
  describe('create', () => {
    it('makes a token for a status link and the SHA-256 hash to store', () => {
      const { token, hash } = create()
      expect(token).toMatch(STATUS_TOKEN_PATTERN)
      expect(hash).toBe(sha256(token))
    })

    it('makes a new token each time', () => {
      const tokens = new Set(Array.from({ length: 20 }, () => create().token))
      expect(tokens.size).toBe(20)
    })
  })

  describe('matches', () => {
    const { token, hash } = create()
    const other = create()

    it('finds the token among the stored hashes', () => {
      expect(matches(token, [hash])).toBe(true)
      expect(matches(token, [other.hash, hash])).toBe(true)
    })

    it('does not match another token, or without hashes', () => {
      expect(matches(other.token, [hash])).toBe(false)
      expect(matches(token, [])).toBe(false)
    })

    it.each([
      ['the token itself', token],
      ['an upper-case hash', hash.toUpperCase()],
      ['a shorter hash', hash.slice(0, 62)],
      ['no string', 42]
    ])('ignores a stored hash that is %s', (name, stored) => {
      expect(matches(token, [stored])).toBe(false)
    })
  })
})
