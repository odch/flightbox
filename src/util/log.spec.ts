import * as Sentry from '@sentry/react';
import {error} from './log';

jest.mock('@sentry/react', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
}));

describe('util', () => {
  describe('log', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('logs to console.error', () => {
      error('Test message', new Error('oops'));
      expect(console.error).toHaveBeenCalledWith('Test message', expect.any(Error));
    });

    it('captures Error instances as exceptions in Sentry', () => {
      const err = new Error('fail');
      error('Something failed', err);
      expect(Sentry.captureException).toHaveBeenCalledWith(err, {extra: {message: 'Something failed'}});
    });

    it('captures non-Error values as Sentry messages', () => {
      error('Something failed', 'string error');
      expect(Sentry.captureMessage).toHaveBeenCalledWith('Something failed: string error');
      expect(Sentry.captureException).not.toHaveBeenCalled();
    });
  });
});
