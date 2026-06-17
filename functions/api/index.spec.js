'use strict';

// The /users/import (member management) route is registered only when the
// generated member-management flag is truthy. The flag file is absent in tests,
// so it is mocked per-case (virtual module).

const FLAG_PATH = '../member-management.generated.js';

const loadApi = (flag) => {
  jest.resetModules();
  jest.doMock(FLAG_PATH, () => flag, { virtual: true });
  jest.doMock('firebase-functions/v2/https', () => ({
    onRequest: (opts, app) => app,
  }));
  return require('./index').app;
};

const hasUsersImportRoute = (app) =>
  app._router.stack.some(
    layer => layer.route && String(layer.route.path).includes('/users/import')
  );

describe('functions', () => {
  describe('api/index member-management gating', () => {
    afterEach(() => {
      jest.dontMock(FLAG_PATH);
      jest.resetModules();
    });

    it('does not register /users/import when member management is disabled', () => {
      const app = loadApi(false);
      expect(hasUsersImportRoute(app)).toBe(false);
    });

    it('does not register /users/import when the flag file is missing', () => {
      // Simulate the generated file being absent (MODULE_NOT_FOUND -> disabled).
      jest.resetModules();
      jest.doMock('firebase-functions/v2/https', () => ({ onRequest: (opts, app) => app }));
      const app = require('./index').app;
      expect(hasUsersImportRoute(app)).toBe(false);
    });

    it('registers /users/import when member management is enabled', () => {
      const app = loadApi(true);
      expect(hasUsersImportRoute(app)).toBe(true);
    });
  });
});
