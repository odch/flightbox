import { httpsUrl } from './httpsUrl';

describe('util', () => {
  describe('httpsUrl', () => {
    it.each(['https://aerodrome.ch/privacy', 'HTTPS://AERODROME.CH/'])('keeps %s', url => {
      expect(httpsUrl(url)).toBe(url);
    });

    it.each(['http://aerodrome.ch/privacy', 'javascript:alert(1)', 'aerodrome.ch', ' https://aerodrome.ch', '', null, undefined])(
      'drops %p',
      url => {
        expect(httpsUrl(url)).toBeNull();
      }
    );
  });
});
