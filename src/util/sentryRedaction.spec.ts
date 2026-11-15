import { redactBreadcrumb, redactEvent, redactPprStatusLinks } from './sentryRedaction';

const TOKEN = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJ-_0123';

describe('util', () => {
  describe('sentryRedaction', () => {
    describe('redactPprStatusLinks', () => {
      it('cuts the key and the token out of a status link', () => {
        expect(redactPprStatusLinks(`https://lspl-test.web.app/#/ppr/status/-Nabc_123/${TOKEN}`))
          .toBe('https://lspl-test.web.app/#/ppr/status/[Filtered]');
      });

      it('keeps what follows the path', () => {
        expect(redactPprStatusLinks(`/#/ppr/status/-Nabc/${TOKEN}?x=1`)).toBe('/#/ppr/status/[Filtered]?x=1');
        expect(redactPprStatusLinks(`/#/ppr/status/-Nabc/${TOKEN} failed`)).toBe('/#/ppr/status/[Filtered] failed');
      });

      it('also cuts incomplete links and the API calls of the status page', () => {
        expect(redactPprStatusLinks('/#/ppr/status/-Nabc')).toBe('/#/ppr/status/[Filtered]');
        expect(redactPprStatusLinks('https://europe-west1-x.cloudfunctions.net/api/ppr/status/-Nabc/withdraw'))
          .toBe('https://europe-west1-x.cloudfunctions.net/api/ppr/status/[Filtered]');
      });

      it('finds every link, in any case', () => {
        expect(redactPprStatusLinks(`from /#/PPR/Status/-Nabc/${TOKEN} to /#/ppr/status/-Ndef/${TOKEN}`))
          .toBe('from /#/PPR/Status/[Filtered] to /#/ppr/status/[Filtered]');
      });

      it.each(['https://lspl-test.web.app/#/ppr/new', '/#/admin?tab=ppr&request=-Nabc', '/#/ppr'])(
        'leaves %s alone',
        url => {
          expect(redactPprStatusLinks(url)).toBe(url);
        }
      );
    });

    describe('redactEvent', () => {
      it('redacts the URL of the page', () => {
        const event = {
          type: undefined,
          message: 'TypeError',
          request: { url: `https://lspl-test.web.app/#/ppr/status/-Nabc/${TOKEN}`, headers: { 'User-Agent': 'x' } },
        };

        expect(redactEvent(event)).toEqual({
          ...event,
          request: { url: 'https://lspl-test.web.app/#/ppr/status/[Filtered]', headers: { 'User-Agent': 'x' } },
        });
        expect(event.request.url).toContain(TOKEN);
      });

      it('leaves an event without a URL as it is', () => {
        const event = { type: undefined, message: 'TypeError' };
        expect(redactEvent(event)).toBe(event);
      });
    });

    describe('redactBreadcrumb', () => {
      it('redacts the URLs of a navigation', () => {
        const breadcrumb = {
          category: 'navigation',
          data: { from: '/#/ppr/guest', to: `/#/ppr/status/-Nabc/${TOKEN}` },
        };

        expect(redactBreadcrumb(breadcrumb)).toEqual({
          category: 'navigation',
          data: { from: '/#/ppr/guest', to: '/#/ppr/status/[Filtered]' },
        });
        expect(breadcrumb.data.to).toContain(TOKEN);
      });

      it('redacts the URL of an API call and keeps its other data', () => {
        const breadcrumb = {
          category: 'fetch',
          data: { method: 'POST', status_code: 404, url: 'https://x.cloudfunctions.net/api/ppr/status/-Nabc' },
        };

        expect(redactBreadcrumb(breadcrumb).data).toEqual({
          method: 'POST',
          status_code: 404,
          url: 'https://x.cloudfunctions.net/api/ppr/status/[Filtered]',
        });
      });

      it('redacts a message', () => {
        const breadcrumb = { category: 'console', message: `No route for /ppr/status/-Nabc/${TOKEN}/x` };
        expect(redactBreadcrumb(breadcrumb).message).toBe('No route for /ppr/status/[Filtered]');
      });

      it('keeps a breadcrumb without a message or data', () => {
        expect(redactBreadcrumb({ category: 'ui.click' })).toEqual({ category: 'ui.click' });
      });
    });
  });
});
