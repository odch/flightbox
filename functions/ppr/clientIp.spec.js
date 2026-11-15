'use strict'

const { clientRateLimitSubject, UNKNOWN_CLIENT } = require('./clientIp')

const request = (forwardedFor, remoteAddress = '169.254.8.129') => ({
  headers: forwardedFor === undefined ? {} : { 'x-forwarded-for': forwardedFor },
  socket: { remoteAddress }
})

describe('clientRateLimitSubject', () => {
  it('takes the address Google\'s front end appended to X-Forwarded-For', () => {
    expect(clientRateLimitSubject(request('203.0.113.7'))).toBe('203.0.113.7')
  })

  it('ignores the entries the caller sent, which it can choose freely', () => {
    expect(clientRateLimitSubject(request('6.6.6.6, 203.0.113.7'))).toBe('203.0.113.7')
    expect(clientRateLimitSubject(request('6.6.6.6,7.7.7.7,203.0.113.7'))).toBe('203.0.113.7')
    expect(clientRateLimitSubject(request('garbage, , 203.0.113.7'))).toBe('203.0.113.7')
  })

  it.each([
    ['a port', '203.0.113.7:51234', '203.0.113.7'],
    ['an IPv4 address mapped to IPv6', '::ffff:203.0.113.7', '203.0.113.7'],
    ['a mapped IPv4 address in hex', '::ffff:cb00:7107', '203.0.113.7']
  ])('reads an IPv4 address with %s', (name, entry, subject) => {
    expect(clientRateLimitSubject(request(entry))).toBe(subject)
  })

  it.each([
    ['in short', '2001:db8:abcd:12::1'],
    ['in full, upper case', '2001:0DB8:ABCD:0012:0000:0000:0000:0002'],
    ['in brackets with a port', '[2001:db8:abcd:12:ffff:ffff:ffff:ffff]:443'],
    ['with a zone', '2001:db8:abcd:12::3%eth0']
  ])('counts an IPv6 address by its /64 network (%s)', (name, entry) => {
    expect(clientRateLimitSubject(request(entry))).toBe('2001:db8:abcd:12::/64')
  })

  it('tells IPv6 networks apart', () => {
    expect(clientRateLimitSubject(request('2001:db8:abcd:13::1'))).toBe('2001:db8:abcd:13::/64')
    expect(clientRateLimitSubject(request('2001:db8::1'))).toBe('2001:db8:0:0::/64')
    expect(clientRateLimitSubject(request('::1'))).toBe('0:0:0:0::/64')
  })

  it('reads an IPv6 address with an IPv4 address at its end', () => {
    expect(clientRateLimitSubject(request('64:ff9b:1:2::192.0.2.33'))).toBe('64:ff9b:1:2::/64')
  })

  it('takes the socket\'s peer without the header (the emulator)', () => {
    expect(clientRateLimitSubject(request(undefined, '127.0.0.1'))).toBe('127.0.0.1')
    expect(clientRateLimitSubject(request(undefined, '::ffff:127.0.0.1'))).toBe('127.0.0.1')
  })

  it.each([
    ['an entry that is no address', request('6.6.6.6, unknown')],
    ['an empty header and no socket', { headers: { 'x-forwarded-for': ' , ' } }],
    ['no headers', {}]
  ])('counts all requests with %s together', (name, req) => {
    expect(clientRateLimitSubject(req)).toBe(UNKNOWN_CLIENT)
  })
})
