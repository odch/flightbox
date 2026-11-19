/** @jest-environment node */
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
jest.mock('../ppr/enabled', () => ({
  isPprEnabled: jest.fn(),
  isPprGuestRequestsEnabled: jest.fn(),
}));

const routeLayers = app => app.router.stack.filter(layer => layer.route);

function loadApi(projectConfig, { pprEnabled = false } = {}) {
  let loaded;
  jest.isolateModules(() => {
    require('../projectConfig').loadProjectConfig.mockReturnValue(projectConfig);
    require('../ppr/enabled').isPprEnabled.mockReturnValue(pprEnabled);
    loaded = {
      api: require('./index'),
      fbAdminAuth: require('./fbAuth').fbAdminAuth,
      getDatabase: require('firebase-admin/database').getDatabase,
      pprRoutes: require('../ppr/routes'),
      publicPprRoutes: require('../ppr/publicRoutes'),
    };
  });
  return loaded;
}

const findRoute = (api, path) => routeLayers(api).find(layer => layer.route.path.includes(path));

const pprLayer = ({ api, pprRoutes }) => api.router.stack.find(layer => layer.handle === pprRoutes);
const publicPprIndex = ({ api, publicPprRoutes }) => api.router.stack.findIndex(layer => layer.handle === publicPprRoutes);
const corsIndex = ({ api }) => api.router.stack.findIndex(layer => layer.name === 'corsMiddleware');

describe('functions', () => {
  describe('api', () => {
    it('has no PPR routes for aerodromes without PPR', () => {
      const loaded = loadApi({ reportApiEnabled: false });

      expect(pprLayer(loaded)).toBeUndefined();
      expect(publicPprIndex(loaded)).toBe(-1);
    });

    it('serves the PPR routes without login on /ppr only, ahead of the permissive CORS', () => {
      const loaded = loadApi({ reportApiEnabled: false }, { pprEnabled: true });
      const index = publicPprIndex(loaded);
      const layer = loaded.api.router.stack[index];

      expect(index).toBeGreaterThanOrEqual(0);
      // Otherwise the permissive CORS would answer their preflights
      expect(index).toBeLessThan(corsIndex(loaded));
      expect(layer.match('/ppr/status/-NxAbC_12')).toBe(true);
      // Not through Firebase Hosting, whose CDN hides the client's address
      expect(layer.match('/api/ppr/status/-NxAbC_12')).toBe(false);
    });

    it('keeps the PPR routes with login behind the permissive CORS', () => {
      const loaded = loadApi({ reportApiEnabled: false }, { pprEnabled: true });

      expect(loaded.api.router.stack.indexOf(pprLayer(loaded))).toBeGreaterThan(corsIndex(loaded));
    });

    it('serves the PPR routes on /ppr and /api/ppr for aerodromes with PPR', () => {
      const layer = pprLayer(loadApi({ reportApiEnabled: false }, { pprEnabled: true }));

      expect(layer).toBeDefined();
      expect(layer.match('/ppr/requests')).toBe(true);
      expect(layer.match('/api/ppr/requests')).toBe(true);
      expect(layer.match('/aerodrome/status')).toBe(false);
    });

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

    it('has no MCP routes unless the tenant enables mcpEnabled', () => {
      [{ reportApiEnabled: false, mcpEnabled: false }, { reportApiEnabled: true, aerodrome: { ICAO: 'LSZE', runways: [] } }]
        .forEach(config => {
          const { api } = loadApi(config);
          const paths = routeLayers(api).map(layer => layer.route.path).flat();
          expect(paths.filter(path => path.includes('mcp'))).toEqual([]);
        });
    });

    it('serves the public MCP endpoint when the tenant enables mcpEnabled', () => {
      const { api } = loadApi({ reportApiEnabled: false, mcpEnabled: true, aerodrome: { ICAO: 'LSZT', runways: [] } });
      const mcpLayers = routeLayers(api).filter(layer => layer.route.path.includes('/api/v1/mcp'));

      mcpLayers.forEach(layer => expect(layer.route.path).toEqual(['/v1/mcp', '/api/v1/mcp']));
      expect(mcpLayers.map(layer => Object.keys(layer.route.methods)).flat().sort()).toEqual(['delete', 'get', 'post']);
      expect(routeLayers(api).some(layer => layer.route.path.includes('/api/v1/reports/airstat'))).toBe(false);
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
