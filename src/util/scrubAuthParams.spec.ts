import {stripAuthParams, scrubAuthParamsFromUrl} from './scrubAuthParams';

describe('util', () => {
  describe('stripAuthParams', () => {
    it('removes the kiosk token from a HashRouter fragment, keeping the path', () => {
      const href = 'https://flightbox.ch/#/?kt=a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      expect(stripAuthParams(href)).toBe('https://flightbox.ch/#/');
    });

    it('removes the guest token and guestOnly flag from the fragment', () => {
      const href = 'https://flightbox.ch/#/?t=tok&guestOnly=true';
      expect(stripAuthParams(href)).toBe('https://flightbox.ch/#/');
    });

    it('keeps non-auth params in the fragment query', () => {
      const href = 'https://flightbox.ch/#/movements?kt=tok&foo=bar';
      expect(stripAuthParams(href)).toBe('https://flightbox.ch/#/movements?foo=bar');
    });

    it('removes a legacy kiosk token from the real query string', () => {
      const href = 'https://flightbox.ch/?kt=a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      expect(stripAuthParams(href)).toBe('https://flightbox.ch/');
    });

    it('leaves a URL without auth params unchanged', () => {
      const href = 'https://flightbox.ch/#/movements';
      expect(stripAuthParams(href)).toBe(href);
    });
  });

  describe('scrubAuthParamsFromUrl', () => {
    it('calls history.replaceState with the scrubbed URL', () => {
      const replaceState = jest.fn();
      const win = {
        location: { href: 'https://flightbox.ch/#/?kt=tok' },
        history: { state: { a: 1 }, replaceState },
      } as any;

      scrubAuthParamsFromUrl(win);

      expect(replaceState).toHaveBeenCalledTimes(1);
      expect(replaceState).toHaveBeenCalledWith({ a: 1 }, '', 'https://flightbox.ch/#/');
    });

    it('does nothing when there are no auth params to strip', () => {
      const replaceState = jest.fn();
      const win = {
        location: { href: 'https://flightbox.ch/#/movements' },
        history: { state: null, replaceState },
      } as any;

      scrubAuthParamsFromUrl(win);

      expect(replaceState).not.toHaveBeenCalled();
    });
  });
});
