/** @jest-environment node */
'use strict';

jest.mock('firebase-functions/logger', () => ({ error: jest.fn() }));

const express = require('express');
const logger = require('firebase-functions/logger');
const { asyncRoute } = require('./asyncRoute');
const { ApiError, validationError } = require('./errors');
const { requestId } = require('./requestId');
const { listen } = require('./testing/listen');

describe('functions', () => {
  describe('api/http/asyncRoute', () => {
    let server;

    beforeAll(async () => {
      const app = express();
      app.use(requestId);
      app.get(
        '/ok',
        asyncRoute(async (req, res) => {
          await Promise.resolve();
          res.json({ ok: true });
        })
      );
      app.get(
        '/locked',
        asyncRoute(async () => {
          throw new ApiError('failed-precondition', 'Movement is locked', {
            reason: 'movement-locked',
          });
        })
      );
      app.get(
        '/invalid',
        asyncRoute(async () => {
          throw validationError([{ field: 'runway', reason: 'invalid' }]);
        })
      );
      app.get(
        '/crash',
        asyncRoute(async () => {
          throw new Error('Firebase internals: /secret/path');
        })
      );
      app.get(
        '/sync-crash',
        asyncRoute(() => {
          throw new TypeError('x is undefined');
        })
      );
      app.get(
        '/middleware',
        asyncRoute(async (req, res, next) => {
          req.fromMiddleware = 'yes';
          next();
        }),
        (req, res) => res.json({ fromMiddleware: req.fromMiddleware })
      );
      // An existing-style route without the wrapper keeps its own answer.
      app.get('/legacy', (req, res) => res.status(401).send('Unauthorized'));
      server = await listen(app);
    });

    afterAll(() => server.close());
    beforeEach(() => jest.clearAllMocks());

    it('passes successful responses through', async () => {
      const response = await server.request('/ok');

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ ok: true });
    });

    it('answers a thrown ApiError in the envelope', async () => {
      const response = await server.request('/locked');

      expect(response.status).toBe(409);
      expect(await response.json()).toEqual({
        error: {
          code: 'failed-precondition',
          message: 'Movement is locked',
          details: { reason: 'movement-locked' },
        },
      });
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('answers validation errors with their details', async () => {
      const response = await server.request('/invalid');

      expect(response.status).toBe(400);
      expect((await response.json()).error.details).toEqual({
        reason: 'validation-failed',
        validationErrors: [{ field: 'runway', reason: 'invalid' }],
      });
    });

    it.each(['/crash', '/sync-crash'])(
      'answers other errors from %s as a logged internal error',
      async path => {
        const response = await server.request(path, {
          headers: { 'X-Request-Id': 'trace-0123456789' },
        });
        const body = await response.text();

        expect(response.status).toBe(500);
        expect(JSON.parse(body)).toEqual({
          error: { code: 'internal', message: 'Internal error' },
        });
        expect(body).not.toMatch(/secret|undefined|at /);
        expect(response.headers.get('X-Request-Id')).toBe('trace-0123456789');
        expect(logger.error).toHaveBeenCalledWith(
          'API request failed',
          expect.objectContaining({
            requestId: 'trace-0123456789',
            method: 'GET',
            path,
          })
        );
      }
    );

    it('lets wrapped middleware call next', async () => {
      const response = await server.request('/middleware');

      expect(await response.json()).toEqual({ fromMiddleware: 'yes' });
    });

    it('leaves unwrapped routes alone', async () => {
      const response = await server.request('/legacy');

      expect(response.status).toBe(401);
      expect(await response.text()).toBe('Unauthorized');
    });
  });
});
