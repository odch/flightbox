/** @jest-environment node */
'use strict';

const express = require('express');
const { requestId, resolveRequestId, REQUEST_ID_HEADER } = require('./requestId');
const { listen } = require('./testing/listen');

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('functions', () => {
  describe('api/http/requestId', () => {
    describe('resolveRequestId', () => {
      it.each([
        '3f1c2a9e-8d4b-4c6a-9e2f-1b7d5a3c8e01',
        '0123456789abcdef0123456789abcdef',
        'client_req-42abc',
      ])('accepts %j', id => {
        expect(resolveRequestId(id)).toBe(id);
      });

      it.each([
        undefined,
        '',
        'short',
        'x'.repeat(65),
        'abc def ghi',
        'abcdefgh\r\nSet-Cookie: a=b',
        'abcdefgh<script>',
        'a1b2c3d4, e5f6a7b8',
        ['abcdefgh1', 'abcdefgh2'],
      ])('replaces %j with a generated id', id => {
        expect(resolveRequestId(id, () => 'generated')).toBe('generated');
      });

      it('generates UUIDs by default', () => {
        expect(resolveRequestId(undefined)).toMatch(UUID);
      });
    });

    describe('middleware', () => {
      let server;
      let seen;

      beforeAll(async () => {
        const app = express();
        app.use(requestId);
        app.get('/x', (req, res) => {
          seen = req.requestId;
          res.status(204).end();
        });
        server = await listen(app);
      });

      afterAll(() => server.close());

      it('generates an id and exposes it on the request and response', async () => {
        const response = await server.request('/x');

        expect(response.headers.get(REQUEST_ID_HEADER)).toMatch(UUID);
        expect(seen).toBe(response.headers.get(REQUEST_ID_HEADER));
      });

      it('keeps an acceptable incoming id', async () => {
        const response = await server.request('/x', {
          headers: { 'X-Request-Id': 'trace-0123456789' },
        });

        expect(response.headers.get(REQUEST_ID_HEADER)).toBe('trace-0123456789');
        expect(seen).toBe('trace-0123456789');
      });

      it('replaces an unacceptable incoming id', async () => {
        const response = await server.request('/x', {
          headers: { 'X-Request-Id': 'bad id <b>' },
        });

        expect(response.headers.get(REQUEST_ID_HEADER)).toMatch(UUID);
      });

      it('sets a new id per request', async () => {
        const first = await server.request('/x');
        const second = await server.request('/x');

        expect(first.headers.get(REQUEST_ID_HEADER)).not.toBe(
          second.headers.get(REQUEST_ID_HEADER)
        );
      });
    });
  });
});
