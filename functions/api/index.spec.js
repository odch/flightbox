jest.mock('firebase-functions/v2/https', () => ({
  onRequest: (options, app) => app,
}));
jest.mock('../projectConfig', () => ({
  loadProjectConfig: jest.fn(),
}));
jest.mock('./fbAuth', () => ({
  fbAuth: jest.fn(),
  fbAdminAuth: jest.fn((req, res, next) => next()),
  fbAuthExcludingShared: jest.fn(),
}));
jest.mock('firebase-admin/database', () => ({ getDatabase: jest.fn() }));

const routeLayers = app => app.router.stack.filter(layer => layer.route);

function loadApi(projectConfig) {
  let loaded;
  jest.isolateModules(() => {
    require('../projectConfig').loadProjectConfig.mockReturnValue(projectConfig);
    loaded = {
      api: require('./index'),
      fbAdminAuth: require('./fbAuth').fbAdminAuth,
      getDatabase: require('firebase-admin/database').getDatabase,
    };
  });
  return loaded;
}

const findRoute = (api, path) => routeLayers(api).find(layer => layer.route.path.includes(path));

describe('functions', () => {
  describe('api', () => {
    it('serves the public aerodrome status on the v1 and the unversioned paths', async () => {
      const { api, getDatabase } = loadApi({ reportApiEnabled: false });
      const layer = findRoute(api, '/api/v1/aerodrome/status');

      expect(layer.route.path).toEqual(expect.arrayContaining([
        '/v1/aerodrome/status', '/api/v1/aerodrome/status', '/aerodrome/status', '/api/aerodrome/status',
      ]));
      expect(layer.route.methods).toEqual({ get: true });
      expect(layer.route.stack).toHaveLength(1);

      const statuses = { s1: { status: 'open', timestamp: Date.UTC(2026, 9, 4, 7), by: 'Hans Meier', details: 'Offen' } };
      const query = { orderByChild: () => query, limitToLast: () => query, once: async () => ({ val: () => statuses }) };
      getDatabase.mockReturnValue({ ref: () => query });
      const res = { setHeader: jest.fn(), send: jest.fn() };
      await layer.route.stack[0].handle({}, res);

      expect(res.send).toHaveBeenCalledWith({
        status: 'open', last_update_date: '2026-10-04T07:00:00.000Z', last_update_by: 'Hans Meier', message: 'Offen',
      });
    });

    it('has no report or API key routes for tenants without an API feature', () => {
      const { api } = loadApi({ reportApiEnabled: false });
      const paths = routeLayers(api).map(layer => layer.route.path).flat();

      expect(paths).toContain('/api/aerodrome/status');
      expect(paths.filter(path => path.includes('reports') || path.includes('api-keys'))).toEqual([]);
    });

    it('serves the airstat report to API keys and admins when the tenant enables it', async () => {
      const { api, fbAdminAuth } = loadApi({ reportApiEnabled: true, aerodrome: { ICAO: 'LSZE', runways: [] } });
      const layer = findRoute(api, '/api/v1/reports/airstat');

      expect(layer.route.path).toEqual(['/v1/reports/airstat', '/api/v1/reports/airstat']);
      expect(layer.route.methods).toEqual({ get: true });

      // A Firebase ID token goes to the admin check.
      const req = { headers: { authorization: 'Bearer eyJ.id.token' }, query: {} };
      const next = jest.fn();
      await layer.route.stack[0].handle(req, {}, next);
      expect(fbAdminAuth).toHaveBeenCalledWith(req, {}, next);
    });

    it('lets admins manage API keys when the tenant has an API feature', () => {
      const { api, fbAdminAuth } = loadApi({ reportApiEnabled: true, aerodrome: { ICAO: 'LSZE', runways: [] } });

      const list = routeLayers(api).find(layer =>
        layer.route.path.includes('/api/v1/api-keys') && layer.route.methods.get);
      const revoke = findRoute(api, '/api/v1/api-keys/:id');

      expect(list.route.stack[0].handle).toBe(fbAdminAuth);
      expect(revoke.route.methods).toEqual({ delete: true });
      expect(revoke.route.stack[0].handle).toBe(fbAdminAuth);
    });
  });
});
