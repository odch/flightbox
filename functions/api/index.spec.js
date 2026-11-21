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
jest.mock('firebase-admin/auth', () => ({ getAuth: jest.fn() }));
jest.mock('firebase-admin/app', () => ({ getApp: jest.fn() }));

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

    it('has no movement routes unless the tenant enables movementWritesViaApi or centralLogin', () => {
      [
        { reportApiEnabled: false, movementWritesViaApi: false },
        { reportApiEnabled: true, aerodrome: { ICAO: 'LSZE', runways: [] } },
      ].forEach(config => {
        const { api } = loadApi(config);
        const paths = routeLayers(api).map(layer => layer.route.path).flat();
        expect(paths.filter(path => path.includes('movements'))).toEqual([]);
      });
    });

    it('serves movement writes to users when the tenant enables movementWritesViaApi', () => {
      const { api } = loadApi({ reportApiEnabled: false, movementWritesViaApi: true });
      const movementLayers = routeLayers(api).filter(layer =>
        [].concat(layer.route.path).some(path => path.startsWith('/api/app/movements')));
      const routes = movementLayers.map(layer => [Object.keys(layer.route.methods), layer.route.path]);

      expect(routes).toEqual([
        [['post'], ['/app/movements/:type', '/api/app/movements/:type']],
        [['patch'], ['/app/movements/:type/:key', '/api/app/movements/:type/:key']],
        [['get'], ['/app/movements', '/api/app/movements']],
        [['get'], ['/app/movements/arrivals/:key/payment', '/api/app/movements/arrivals/:key/payment']],
        [['post'], ['/app/movements/arrivals/:key/payment', '/api/app/movements/arrivals/:key/payment']],
      ]);
      // Writes: requestId, appAuth, requireScope, JSON body, handler; the
      // list: requestId, appAuth, requireScope, handler.
      // Payment: requestId, appAuth, requireScope, (JSON body,) handler.
      expect(movementLayers.map(layer => layer.route.stack.length)).toEqual([5, 5, 4, 4, 5]);
    });

    it('serves the movement API to central login clients when the tenant sets centralLogin', () => {
      const centralLogin = { issuer: 'https://login.example.com', jwksUri: 'https://login.example.com/jwks', audience: 'flightbox-test' };
      const { api } = loadApi({ reportApiEnabled: false, movementWritesViaApi: false, centralLogin });
      const paths = routeLayers(api).map(layer => layer.route.path).flat();

      expect(paths).toEqual(expect.arrayContaining([
        '/api/app/movements/:type', '/api/app/movements/:type/:key', '/api/app/movements',
        '/api/app/movements/arrivals/:key/payment',
      ]));
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
