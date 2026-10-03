jest.mock('firebase-functions/v2/https', () => ({
  onRequest: (options, app) => app,
}));
jest.mock('../projectConfig', () => ({
  loadProjectConfig: jest.fn(),
}));
jest.mock('firebase-admin/auth', () => ({ getAuth: jest.fn() }));
jest.mock('firebase-admin/database', () => ({ getDatabase: jest.fn() }));

const routePaths = app => app.router.stack
  .filter(layer => layer.route)
  .map(layer => layer.route.path);

function loadApi(projectConfig) {
  let loaded;
  jest.isolateModules(() => {
    require('../projectConfig').loadProjectConfig.mockReturnValue(projectConfig);
    loaded = { api: require('./index'), fbAdminAuth: require('./fbAuth').fbAdminAuth };
  });
  return loaded;
}

describe('functions', () => {
  describe('api', () => {
    it('has no report route for tenants without reportApiEnabled', () => {
      const { api } = loadApi({ reportApiEnabled: false });
      const paths = routePaths(api);

      expect(paths).toContainEqual(['/aerodrome/status', '/api/aerodrome/status']);
      expect(paths.flat().filter(path => path.includes('reports'))).toEqual([]);
    });

    it('serves the airstat report to admins when the tenant enables it', () => {
      const { api, fbAdminAuth } = loadApi({ reportApiEnabled: true, aerodrome: { ICAO: 'LSZE', runways: [] } });
      const layer = api.router.stack
        .find(entry => entry.route && entry.route.path.includes('/api/v1/reports/airstat'));

      expect(layer.route.path).toEqual(['/v1/reports/airstat', '/api/v1/reports/airstat']);
      expect(layer.route.methods).toEqual({ get: true });
      expect(layer.route.stack[0].handle).toBe(fbAdminAuth);
    });
  });
});
