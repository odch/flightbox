/** @jest-environment node */
'use strict';

jest.mock('firebase-functions/logger', () => ({ error: jest.fn() }));

const express = require('express');
const logger = require('firebase-functions/logger');
const {
  ApiError,
  STATUS_BY_CODE,
  validationError,
  sendError,
  errorHandler,
} = require('./errors');
const { listen } = require('./testing/listen');

function fakeRes({ headersSent = false } = {}) {
  return {
    headersSent,
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

const req = { requestId: 'req-12345678', method: 'POST', path: '/x' };

describe('functions', () => {
  describe('api/http/errors', () => {
    beforeEach(() => jest.clearAllMocks());

    describe('ApiError', () => {
      it.each([
        ['invalid-argument', 400],
        ['unauthenticated', 401],
        ['permission-denied', 403],
        ['not-found', 404],
        ['failed-precondition', 409],
        ['resource-exhausted', 429],
        ['internal', 500],
      ])('maps %s to HTTP %i', (code, status) => {
        const error = new ApiError(code, 'Message');

        expect(error).toBeInstanceOf(Error);
        expect(error.code).toBe(code);
        expect(error.status).toBe(status);
        expect(error.message).toBe('Message');
        expect(STATUS_BY_CODE[code]).toBe(status);
      });

      it('keeps details', () => {
        const error = new ApiError('failed-precondition', 'Locked', {
          reason: 'movement-locked',
        });

        expect(error.details).toEqual({ reason: 'movement-locked' });
      });

      it('rejects unknown codes', () => {
        expect(() => new ApiError('teapot', 'x')).toThrow(TypeError);
        expect(() => new ApiError('toString', 'x')).toThrow(TypeError);
      });
    });

    describe('validationError', () => {
      it('is an invalid-argument error with the validation errors', () => {
        const error = validationError([
          { field: 'runway', reason: 'invalid' },
        ]);

        expect(error.code).toBe('invalid-argument');
        expect(error.status).toBe(400);
        expect(error.details).toEqual({
          reason: 'validation-failed',
          validationErrors: [{ field: 'runway', reason: 'invalid' }],
        });
      });
    });

    describe('sendError', () => {
      it('answers an ApiError in the envelope', () => {
        const res = fakeRes();

        sendError(req, res, new ApiError('not-found', 'Movement not found'));

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
          error: { code: 'not-found', message: 'Movement not found' },
        });
        expect(logger.error).not.toHaveBeenCalled();
      });

      it('includes details when present', () => {
        const res = fakeRes();

        sendError(req, res, validationError([{ field: 'a', reason: 'b' }]));

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: {
            code: 'invalid-argument',
            message: 'Validation failed',
            details: {
              reason: 'validation-failed',
              validationErrors: [{ field: 'a', reason: 'b' }],
            },
          },
        });
      });

      it('hides and logs any other error', () => {
        const res = fakeRes();
        const error = new Error('secret database path /admins/xyz');

        sendError(req, res, error);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          error: { code: 'internal', message: 'Internal error' },
        });
        expect(logger.error).toHaveBeenCalledWith('API request failed', {
          requestId: 'req-12345678',
          method: 'POST',
          path: '/x',
          error: error.stack,
        });
      });

      it('hides the message and details of an internal ApiError', () => {
        const res = fakeRes();

        sendError(
          req,
          res,
          new ApiError('internal', 'Lost connection', { host: 'db' })
        );

        expect(res.json).toHaveBeenCalledWith({
          error: { code: 'internal', message: 'Internal error' },
        });
        expect(logger.error).toHaveBeenCalled();
      });

      it('logs non-Error values as they are', () => {
        const res = fakeRes();

        sendError(req, res, 'boom');

        expect(res.status).toHaveBeenCalledWith(500);
        expect(logger.error.mock.calls[0][1].error).toBe('boom');
      });

      it('does not answer twice', () => {
        const res = fakeRes({ headersSent: true });

        sendError(req, res, new Error('late'));

        expect(res.status).not.toHaveBeenCalled();
        expect(logger.error).toHaveBeenCalled();
      });
    });

    describe('errorHandler', () => {
      it('answers through the envelope', () => {
        const res = fakeRes();
        const next = jest.fn();

        errorHandler(new ApiError('permission-denied', 'No'), req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
      });

      it('hands a half-sent response to Express', () => {
        const res = fakeRes({ headersSent: true });
        const next = jest.fn();
        const error = new Error('stream broke');

        errorHandler(error, req, res, next);

        expect(next).toHaveBeenCalledWith(error);
        expect(logger.error).toHaveBeenCalled();
      });

      describe('over HTTP', () => {
        let server;

        beforeAll(async () => {
          const app = express();
          const router = express.Router();
          router.use(express.json({ limit: '1kb' }));
          router.post('/echo', (request, response) =>
            response.json(request.body)
          );
          router.get('/fail', () => {
            throw new Error('sync failure');
          });
          router.use(errorHandler);
          app.use(router);
          server = await listen(app);
        });

        afterAll(() => server.close());

        const post = body =>
          server.request('/echo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body,
          });

        it('answers malformed JSON as invalid-argument', async () => {
          const response = await post('{"a":');

          expect(response.status).toBe(400);
          expect(await response.json()).toEqual({
            error: {
              code: 'invalid-argument',
              message: 'Malformed request body',
              details: { reason: 'malformed-body' },
            },
          });
          expect(logger.error).not.toHaveBeenCalled();
        });

        it('answers a too large body as invalid-argument', async () => {
          const response = await post(
            JSON.stringify({ a: 'x'.repeat(2048) })
          );

          expect(response.status).toBe(400);
          expect((await response.json()).error.details).toEqual({
            reason: 'body-too-large',
          });
        });

        it.each([
          ['charset', { 'Content-Type': 'application/json; charset=klingon' }],
          [
            'content encoding',
            { 'Content-Type': 'application/json', 'Content-Encoding': 'br2' },
          ],
        ])('answers an unsupported %s as invalid-argument', async (_, headers) => {
          const response = await server.request('/echo', {
            method: 'POST',
            headers,
            body: '{}',
          });

          expect(response.status).toBe(400);
          expect((await response.json()).error.details).toEqual({
            reason: 'unsupported-encoding',
          });
          expect(logger.error).not.toHaveBeenCalled();
        });

        it('answers thrown errors as internal without details', async () => {
          const response = await server.request('/fail');

          expect(response.status).toBe(500);
          expect(response.headers.get('content-type')).toMatch(
            /application\/json/
          );
          expect(await response.json()).toEqual({
            error: { code: 'internal', message: 'Internal error' },
          });
        });
      });
    });
  });
});
