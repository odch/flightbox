'use strict';

let capturedHandler = null;

jest.mock('firebase-functions/v2/database', () => ({
  onValueCreated: jest.fn((opts, handler) => { capturedHandler = handler; return handler; }),
}));

jest.mock('firebase-functions/params', () => ({
  defineString: jest.fn(name => ({ name })),
}));

const mockLogger = { log: jest.fn(), warn: jest.fn(), error: jest.fn() };
jest.mock('firebase-functions/v2', () => ({ logger: mockLogger }));

const mockOnce = jest.fn();
const mockAdmin = {
  database: jest.fn(() => ({ ref: jest.fn(() => ({ once: mockOnce })) })),
};
jest.mock('firebase-admin', () => mockAdmin);

require('./index');

describe('functions', () => {
  describe('webhook', () => {
    let mockFetch;

    beforeEach(() => {
      jest.clearAllMocks();
      mockFetch = jest.fn().mockResolvedValue({ ok: true, status: 200 });
      global.fetch = mockFetch;
    });

    const makeEvent = (details) => ({ data: { val: () => ({ details }), ref: 'status/abc' } });
    const setWebhookUrl = (url) => mockOnce.mockResolvedValue({ val: () => url });

    it('does nothing when the webhook URL is empty', async () => {
      setWebhookUrl('');
      await capturedHandler(makeEvent('hi'));
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('does nothing when the webhook URL is null', async () => {
      setWebhookUrl(null);
      await capturedHandler(makeEvent('hi'));
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('does not post to a non-https URL', async () => {
      setWebhookUrl('http://internal.local/hook');
      await capturedHandler(makeEvent('hi'));
      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('does not post to an invalid URL', async () => {
      setWebhookUrl('not a url');
      await capturedHandler(makeEvent('hi'));
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('posts the status details as JSON to a valid https URL, without following redirects', async () => {
      setWebhookUrl('https://hooks.example.com/abc');
      await capturedHandler(makeEvent('Runway closed'));

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toBe('https://hooks.example.com/abc');
      expect(opts.method).toBe('POST');
      expect(opts.headers['Content-Type']).toBe('application/json');
      expect(JSON.parse(opts.body)).toEqual({ text: 'Runway closed' });
      expect(opts.redirect).toBe('error');
      expect(opts.signal).toBeDefined();
    });

    it('throws when the webhook responds with a non-ok status', async () => {
      setWebhookUrl('https://hooks.example.com/abc');
      mockFetch.mockResolvedValue({ ok: false, status: 500 });
      await expect(capturedHandler(makeEvent('x'))).rejects.toThrow('HTTP Error: 500');
    });
  });
});
