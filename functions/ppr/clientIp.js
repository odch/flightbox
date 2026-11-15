'use strict'

const net = require('net')

// What the limit per client counts when no address can be read: all such
// requests share it, so the limit still holds.
const UNKNOWN_CLIENT = 'unknown'

// '[2001:db8::1]:443' and '203.0.113.7:443' without brackets and port
function withoutPort(entry) {
  const bracketed = /^\[([^\]]+)\](?::\d+)?$/.exec(entry)
  if (bracketed) {
    return bracketed[1]
  }
  const ipv4WithPort = /^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/.exec(entry)
  return ipv4WithPort ? ipv4WithPort[1] : entry
}

// The eight 16-bit groups of a valid IPv6 address: '::' expanded, an IPv4
// address at its end turned into the last two groups, a zone ('%eth0') left
// out
function ipv6Groups(address) {
  const [withoutZone] = address.split('%')
  const ipv4 = /(\d+)\.(\d+)\.(\d+)\.(\d+)$/.exec(withoutZone)
  const hex = ipv4
    ? withoutZone.slice(0, ipv4.index) + [
      (Number(ipv4[1]) << 8) | Number(ipv4[2]),
      (Number(ipv4[3]) << 8) | Number(ipv4[4])
    ].map(group => group.toString(16)).join(':')
    : withoutZone
  const [head, tail] = hex.split('::')
  const headGroups = head ? head.split(':') : []
  const tailGroups = tail ? tail.split(':') : []
  const zeros = tail === undefined ? [] : Array(8 - headGroups.length - tailGroups.length).fill('0')
  return [...headGroups, ...zeros, ...tailGroups].map(group => parseInt(group, 16))
}

// An IPv4 address as it is, one mapped to IPv6 ('::ffff:203.0.113.7') as
// IPv4, and other IPv6 addresses by their /64 network: a single customer
// usually gets a whole /64, whose addresses they could switch between.
function rateLimitSubjectOf(address) {
  if (net.isIPv4(address)) {
    return address
  }
  const groups = ipv6Groups(address)
  const isMappedIpv4 = groups.slice(0, 5).every(group => group === 0) && groups[5] === 0xffff
  if (isMappedIpv4) {
    return [groups[6] >> 8, groups[6] & 0xff, groups[7] >> 8, groups[7] & 0xff].join('.')
  }
  return `${groups.slice(0, 4).map(group => group.toString(16)).join(':')}::/64`
}

/**
 * What the limit per client of the routes without login counts for a
 * request: its client's address, normalised (see rateLimitSubjectOf).
 *
 * Google's front end appends the address a request comes from to
 * X-Forwarded-For, after whatever the client sent in it, so only the
 * rightmost entry can be trusted (the leftmost is chosen by the caller).
 * That holds on the function's own URL, where the front end is the only
 * proxy; the routes without login are served there only, not through
 * Firebase Hosting, whose CDN would add an address of its own
 * (functions/api/index.js). Without the header (the emulator) it is the
 * socket's peer.
 */
function clientRateLimitSubject(req) {
  const forwarded = req.headers && req.headers['x-forwarded-for']
  const entries = typeof forwarded === 'string'
    ? forwarded.split(',').map(entry => entry.trim()).filter(Boolean)
    : []
  const raw = entries.length > 0 ? entries[entries.length - 1] : req.socket && req.socket.remoteAddress
  const address = typeof raw === 'string' ? withoutPort(raw) : null
  return address && net.isIP(address) ? rateLimitSubjectOf(address) : UNKNOWN_CLIENT
}

module.exports = { clientRateLimitSubject, UNKNOWN_CLIENT }
