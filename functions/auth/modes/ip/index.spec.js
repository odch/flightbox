'use strict';

describe('functions/auth/modes/ip', () => {
  const makeReq = (xff, remote) => ({
    headers: xff !== undefined ? { 'x-forwarded-for': xff } : {},
    connection: { remoteAddress: remote === undefined ? null : remote },
  });

  let consoleInfoSpy;
  beforeEach(() => {
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
  });
  afterEach(() => {
    consoleInfoSpy.mockRestore();
    delete process.env.AUTH_IPS;
  });

  describe('when AUTH_IPS is not set', () => {
    let ip;
    beforeEach(() => {
      jest.resetModules();
      ip = require('.');
    });

    it('resolves null for any request IP', () => {
      return expect(ip(makeReq('10.0.0.1'))).resolves.toBeNull();
    });
  });

  describe('when AUTH_IPS is set', () => {
    let ip;
    beforeEach(() => {
      jest.resetModules();
      process.env.AUTH_IPS = '10.0.0.1, 10.0.0.2';
      ip = require('.');
    });

    it("returns 'ipauth' when x-forwarded-for matches the first CSV entry", () => {
      return expect(ip(makeReq('10.0.0.1'))).resolves.toBe('ipauth');
    });

    it("returns 'ipauth' when x-forwarded-for matches a trimmed CSV entry", () => {
      return expect(ip(makeReq('10.0.0.2'))).resolves.toBe('ipauth');
    });

    it("returns 'ipauth' when remoteAddress matches and x-forwarded-for is absent", () => {
      return expect(ip(makeReq(undefined, '10.0.0.1'))).resolves.toBe('ipauth');
    });

    it("returns 'ipauth' when x-forwarded-for has multiple hops and the first matches", () => {
      return expect(ip(makeReq('10.0.0.1, 192.168.1.1'))).resolves.toBe('ipauth');
    });

    it('resolves null when the request IP does not match any allowed entry', () => {
      return expect(ip(makeReq('192.168.1.1'))).resolves.toBeNull();
    });

    it('resolves null when no IP can be determined', () => {
      return expect(ip(makeReq())).resolves.toBeNull();
    });
  });
});
