'use strict';

const errors = require('./errors');

describe('functions', () => {
  describe('auth', () => {
    describe('util', () => {
      describe('errors', () => {
        describe('sendClientError', () => {
          it('should send a client error', () => {
            const response = {
              status: jest.fn().mockReturnThis(),
              send: jest.fn().mockReturnThis()
            };

            errors.sendClientError(response, 'Required body property `foo` is missing');

            expect(response.status).toBeCalledWith(400);
            expect(response.send).toBeCalledWith({
              error: 'Required body property `foo` is missing'
            });
          });
        });

        describe('sendServerError', () => {
          it('should send a server error', () => {
            const response = {
              status: jest.fn().mockReturnThis(),
              send: jest.fn().mockReturnThis()
            };
            global.console = {error: jest.fn()};

            const err = new errors.ServerError('test error');

            errors.sendServerError(response, 'Failed to xyz', err);

            expect(response.status).toBeCalledWith(500);
            expect(response.send).toBeCalledWith({
              error: 'Failed to xyz'
            });
            expect(console.error).toBeCalledWith('Failed to xyz', err);
          });
        });
      });
    });
  });
});
