import { createHashHistory } from 'history';
import { applyShortLink, resolveShortLink } from './shortLink';

describe('util', () => {
  describe('shortLink', () => {
    describe('resolveShortLink', () => {
      it.each(['/ppr', '/ppr/', '/PPR', '/Ppr/'])('turns %s into the PPR request', pathname => {
        expect(resolveShortLink({ pathname, hash: '' })).toBe('/#/ppr/new');
      });

      it('also turns it into the PPR request with the empty route of the fragment', () => {
        expect(resolveShortLink({ pathname: '/ppr', hash: '#/' })).toBe('/#/ppr/new');
      });

      it('keeps a route in the fragment, e.g. after a reload', () => {
        expect(resolveShortLink({ pathname: '/ppr', hash: '#/departure/new' })).toBeNull();
        expect(resolveShortLink({ pathname: '/ppr', hash: '#/ppr/guest' })).toBeNull();
      });

      it.each(['/', '/pprx', '/ppr/new', '/admin', '/index.html'])('leaves %s alone', pathname => {
        expect(resolveShortLink({ pathname, hash: '' })).toBeNull();
      });
    });

    describe('applyShortLink', () => {
      afterEach(() => {
        window.history.replaceState(null, '', '/');
      });

      it('replaces the short link before the history is created, which then starts on the PPR request', () => {
        window.history.pushState(null, '', '/ppr');
        const length = window.history.length;

        applyShortLink(window);
        const history = createHashHistory();

        expect(window.location.pathname).toBe('/');
        expect(window.location.hash).toBe('#/ppr/new');
        expect(window.history.length).toBe(length);
        expect(history.location.pathname).toBe('/ppr/new');
      });

      it('leaves other URLs alone', () => {
        window.history.replaceState(null, '', '/#/movements');

        applyShortLink(window);

        expect(window.location.pathname).toBe('/');
        expect(window.location.hash).toBe('#/movements');
      });

      // Why it runs in src/history.ts, before the history is created
      it('would not reach a history created before', () => {
        window.history.replaceState(null, '', '/ppr');
        const history = createHashHistory();

        applyShortLink(window);

        expect(history.location.pathname).toBe('/');
      });
    });
  });
});
