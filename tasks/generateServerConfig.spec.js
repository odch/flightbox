const fs = require('fs');
const path = require('path');
const projects = require('../projects');
const objectToArray = require('../src/util/objectToArray').default;
const os = require('os');
const aircraftCategoriesData = require('../src/util/aircraftCategoriesData');
const { buildServerConfig, buildServerConfigFor, main } = require('./generateServerConfig');

const PROJECTS_DIR = path.resolve(__dirname, '../projects');

// Every tenant project file, enumerated so a new tenant is covered as well.
const PROJECT_NAMES = fs.readdirSync(PROJECTS_DIR)
  .filter(file => file.endsWith('.json') && file !== 'default.json')
  .map(file => file.replace(/\.json$/, ''))
  .sort();

// No `|| {}` fallback: a tenant without environments must fail, not vanish.
const CASES = PROJECT_NAMES.flatMap(project =>
  Object.keys(projects.load(project).environments).map(env => [project, env])
);

// Inverse of projects.packinize: strings were JSON.stringified (DefinePlugin
// code), arrays became index-keyed objects (left as is; the client reads them
// through objectToArray).
function unpackinize(value) {
  if (typeof value === 'string') {
    return JSON.parse(value);
  }
  if (value !== null && typeof value === 'object') {
    const result = {};
    Object.keys(value).forEach(key => {
      result[key] = unpackinize(value[key]);
    });
    return result;
  }
  return value;
}

// The client's view: load the real webpack.config.js for the project/env and
// read the __CONF__ definition it hands to DefinePlugin.
function loadClientConf(project, env) {
  const saved = {
    npm_config_project: process.env.npm_config_project,
    ENV: process.env.ENV
  };
  process.env.npm_config_project = project;
  process.env.ENV = env;
  try {
    let webpackConfig;
    jest.isolateModules(() => {
      webpackConfig = require('../webpack.config.js');
    });
    const definePlugin = webpackConfig.plugins.find(plugin => plugin.definitions && plugin.definitions.__CONF__);
    return unpackinize(definePlugin.definitions.__CONF__);
  } finally {
    Object.keys(saved).forEach(key => {
      if (saved[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = saved[key];
      }
    });
  }
}

const RUNWAYS = [
  { name: '06', type: 'G' },
  { name: '24', type: 'G' }
];

const DEPARTURE_ROUTES = [
  { name: 'south', label: 'Sektor Süd' },
  { name: 'matzingen', label: 'Matzingen' }
];

const ARRIVAL_ROUTES = [
  { name: 'north', label: 'Sektor Nord' }
];

function makeAerodrome(overrides = {}) {
  return {
    ICAO: 'LSZT',
    name: 'Lommis',
    runways: RUNWAYS,
    departureRoutes: DEPARTURE_ROUTES,
    arrivalRoutes: ARRIVAL_ROUTES,
    ...overrides
  };
}

function makeConf(overrides = {}, environments) {
  return {
    aerodrome: makeAerodrome(),
    memberManagement: false,
    environments: environments || {
      test: { firebaseProjectId: 'flightbox-test' },
      production: { firebaseProjectId: 'flightbox-prod' }
    },
    ...overrides
  };
}

describe('tasks/generateServerConfig', () => {
  it('finds tenant projects, each with at least one environment', () => {
    expect(PROJECT_NAMES.length).toBeGreaterThan(0);
    expect(PROJECT_NAMES).not.toContain('default');
    PROJECT_NAMES.forEach(project => {
      expect(CASES.some(([name]) => name === project)).toBe(true);
    });
  });

  // One check per project/env: the whole output (keys included, hence
  // toStrictEqual) must equal what the client reads from __CONF__.
  it.each(CASES)('%s / %s matches the client __CONF__ built by webpack.config.js', (project, env) => {
    const client = loadClientConf(project, env);
    const actual = buildServerConfigFor(project, env);

    expect(actual).toStrictEqual({
      project,
      env,
      firebaseProjectId: client.firebaseProjectId,
      reportApiEnabled: client.reportApiEnabled === true,
      memberManagement: client.memberManagement === true,
      movementWritesViaApi: client.movementWritesViaApi === true,
      lockOnDateTime: client.lockOnDateTime === true,
      loginForm: client.loginForm,
      enabledFlightTypes: objectToArray(client.enabledFlightTypes),
      aircraftCategories: aircraftCategoriesData.map(({ name }) => name),
      aerodrome: {
        ICAO: client.aerodrome.ICAO,
        runways: objectToArray(client.aerodrome.runways).map(({ name, type }) => ({ name, type })),
        departureRoutes: objectToArray(client.aerodrome.departureRoutes).map(({ name }) => ({ name })),
        arrivalRoutes: objectToArray(client.aerodrome.arrivalRoutes).map(({ name }) => ({ name })),
        noRunwayIfHelicopter: client.aerodrome.noRunwayIfHelicopter === true
      },
      paymentMethods: objectToArray(client.paymentMethods).map(method => (typeof method === 'string'
        ? { name: method }
        : { name: method.name, ...(method.authCondition ? { authCondition: method.authCondition } : {}) })),
      homebasePayment: client.homebasePayment === true,
      ...(client.centralLogin ? { centralLogin: client.centralLogin } : {})
    });
  });

  // The movement domain (functions/movements/domain) mirrors the database
  // rules, which tasks/processFirebaseRules.js builds from the top-level
  // project config (gulpfile.js buildFirebaseRules): both must see the same
  // values.
  it.each(CASES)('%s / %s matches the config the database rules are built from', (project, env) => {
    const rulesConf = projects.load(project);
    const actual = buildServerConfigFor(project, env);

    expect(actual.loginForm).toBe(rulesConf.loginForm);
    expect(actual.lockOnDateTime).toBe(rulesConf.lockOnDateTime === true);
    // Same set; the order is the client's (objectToArray), the rules ignore it.
    expect([...actual.enabledFlightTypes].sort()).toEqual([...rulesConf.enabledFlightTypes].sort());
    expect(actual.aerodrome.ICAO).toBe(rulesConf.aerodrome.ICAO);
    expect(actual.aerodrome.runways.map(({ name }) => name).sort())
      .toEqual(rulesConf.aerodrome.runways.map(({ name }) => name).sort());
    expect(actual.aerodrome.departureRoutes.map(({ name }) => name).sort())
      .toEqual(rulesConf.aerodrome.departureRoutes.map(({ name }) => name).sort());
    expect(actual.aerodrome.arrivalRoutes.map(({ name }) => name).sort())
      .toEqual(rulesConf.aerodrome.arrivalRoutes.map(({ name }) => name).sort());
  });

  // cypress-testing-api only builds the Cypress run of the movement specs
  // with the flag (same Firebase project as cypress-testing).
  it('accepts central login tokens on lsze test only', () => {
    CASES.forEach(([project, env]) => {
      const { centralLogin } = buildServerConfigFor(project, env);
      if (`${project}/${env}` === 'lsze/test') {
        expect(centralLogin).toEqual(expect.objectContaining({ audience: 'flightbox-lsze-test' }));
      } else {
        expect(centralLogin).toBeUndefined();
      }
    });
  });

  it('enables movementWritesViaApi on lsze test and the Cypress API run only', () => {
    const enabled = ['lsze/test', 'cypress-testing-api/test'];
    CASES.forEach(([project, env]) => {
      const expected = enabled.includes(`${project}/${env}`);
      expect(buildServerConfigFor(project, env).movementWritesViaApi).toBe(expected);
    });
  });

  // Both airstat variants (with and without MEMBERNR) must be representable.
  it('has at least one tenant with memberManagement', () => {
    const withMembers = CASES
      .map(([project, env]) => buildServerConfigFor(project, env))
      .filter(conf => conf.memberManagement);
    expect(withMembers.length).toBeGreaterThan(0);
  });

  describe('merge', () => {
    it('lets an environment override reportApiEnabled', () => {
      const conf = makeConf({ reportApiEnabled: false }, {
        test: { firebaseProjectId: 'flightbox-test', reportApiEnabled: true },
        production: { firebaseProjectId: 'flightbox-prod' }
      });
      expect(buildServerConfig('lszt', conf, 'test').reportApiEnabled).toBe(true);
      expect(buildServerConfig('lszt', conf, 'production').reportApiEnabled).toBe(false);
    });

    it('replaces the whole aerodrome when an environment defines one', () => {
      const conf = makeConf({}, {
        test: {
          firebaseProjectId: 'flightbox-test',
          aerodrome: {
            ICAO: 'LSXX',
            runways: [{ name: '36', type: 'A' }],
            departureRoutes: [],
            arrivalRoutes: [{ name: 'west', label: 'West' }]
          }
        },
        production: { firebaseProjectId: 'flightbox-prod' }
      });
      expect(buildServerConfig('lszt', conf, 'test').aerodrome).toEqual({
        ICAO: 'LSXX',
        runways: [{ name: '36', type: 'A' }],
        departureRoutes: [],
        arrivalRoutes: [{ name: 'west' }],
        noRunwayIfHelicopter: false
      });
      expect(buildServerConfig('lszt', conf, 'production').aerodrome).toEqual({
        ICAO: 'LSZT',
        runways: RUNWAYS,
        departureRoutes: [{ name: 'south' }, { name: 'matzingen' }],
        arrivalRoutes: [{ name: 'north' }],
        noRunwayIfHelicopter: false
      });
    });

    it('takes noRunwayIfHelicopter from the aerodrome and rejects non-booleans', () => {
      const withFlag = value => makeConf({ aerodrome: makeAerodrome({ noRunwayIfHelicopter: value }) });
      expect(buildServerConfig('lszt', withFlag(true), 'test').aerodrome.noRunwayIfHelicopter).toBe(true);
      expect(buildServerConfig('lszt', withFlag(false), 'test').aerodrome.noRunwayIfHelicopter).toBe(false);
      expect(() => buildServerConfig('lszt', withFlag('true'), 'test')).toThrow(/aerodrome\.noRunwayIfHelicopter/);
    });

    it('emits centralLogin only for the environment that configures it', () => {
      const centralLogin = {
        issuer: 'https://login.example.ch',
        jwksUri: 'https://login.example.ch/jwks',
        audience: 'flightbox-lsxy-test'
      };
      const conf = makeConf({}, {
        test: { firebaseProjectId: 'flightbox-test', centralLogin },
        production: { firebaseProjectId: 'flightbox-prod' }
      });

      expect(buildServerConfig('lsxy', conf, 'test').centralLogin).toEqual(centralLogin);
      expect(buildServerConfig('lsxy', conf, 'production')).not.toHaveProperty('centralLogin');
    });

    it('disables movementWritesViaApi when it is absent', () => {
      const conf = makeConf();
      expect(buildServerConfig('lszt', conf, 'test').movementWritesViaApi).toBe(false);
      expect(buildServerConfig('lszt', conf, 'production').movementWritesViaApi).toBe(false);
    });

    it('lets an environment override movementWritesViaApi', () => {
      const conf = makeConf({ movementWritesViaApi: false }, {
        test: { firebaseProjectId: 'flightbox-test', movementWritesViaApi: true },
        production: { firebaseProjectId: 'flightbox-prod' }
      });
      expect(buildServerConfig('lszt', conf, 'test').movementWritesViaApi).toBe(true);
      expect(buildServerConfig('lszt', conf, 'production').movementWritesViaApi).toBe(false);
    });

    it('uses the client defaults for flight types and login form when they are absent', () => {
      const actual = buildServerConfig('lszt', makeConf(), 'test');
      expect(actual.enabledFlightTypes).toEqual(['private', 'instruction']);
      expect(actual.loginForm).toBe('usernamePassword');
      expect(actual.lockOnDateTime).toBe(false);
    });

    it('takes flight types, login form and lockOnDateTime from the project', () => {
      const conf = makeConf({
        enabledFlightTypes: ['private', 'aerotow'],
        loginForm: 'email',
        lockOnDateTime: true
      });
      const actual = buildServerConfig('lszt', conf, 'test');
      expect(actual.enabledFlightTypes).toEqual(['private', 'aerotow']);
      expect(actual.loginForm).toBe('email');
      expect(actual.lockOnDateTime).toBe(true);
    });

    it('emits the aircraft category names the database rules accept', () => {
      expect(buildServerConfig('lszt', makeConf(), 'test').aircraftCategories)
        .toEqual(aircraftCategoriesData.map(({ name }) => name));
    });

    it('drops route fields other than name', () => {
      const actual = buildServerConfig('lszt', makeConf(), 'test');
      expect(actual.aerodrome.departureRoutes).toEqual([{ name: 'south' }, { name: 'matzingen' }]);
      expect(actual.aerodrome.arrivalRoutes).toEqual([{ name: 'north' }]);
    });

    it('drops runway fields other than name and type', () => {
      const conf = makeConf({
        aerodrome: makeAerodrome({ runways: [{ name: '06', type: 'G', length: 500 }] })
      });
      expect(buildServerConfig('lszt', conf, 'test').aerodrome.runways).toEqual([{ name: '06', type: 'G' }]);
    });

    it('orders runways like objectToArray(packinize(...)) beyond ten entries', () => {
      const runways = Array.from({ length: 12 }, (_, i) => ({ name: `R${i}`, type: 'A' }));
      const conf = makeConf({ aerodrome: makeAerodrome({ runways }) });
      const expected = objectToArray(unpackinize(projects.packinize({ runways }).runways));
      expect(buildServerConfig('lszt', conf, 'test').aerodrome.runways).toEqual(expected);
      expect(expected[2].name).toBe('R10');
    });

    it('does not mutate its input', () => {
      const conf = makeConf();
      const copy = JSON.parse(JSON.stringify(conf));
      buildServerConfig('lszt', conf, 'test');
      expect(conf).toEqual(copy);
    });
  });

  describe('validation', () => {
    const expectError = (conf, env, field) => {
      expect(() => buildServerConfig('lsxy', conf, env)).toThrow(
        expect.objectContaining({
          message: expect.stringMatching(new RegExp(`"lsxy".*"${env}".*${field}`))
        })
      );
    };

    it('rejects an unknown env name', () => {
      expectError(makeConf(), 'staging', 'env');
    });

    it('rejects a missing environment', () => {
      expectError(makeConf({}, { test: { firebaseProjectId: 'x' } }), 'production', 'environments\\.production');
    });

    it('rejects missing environments', () => {
      const { environments, ...conf } = makeConf();
      expectError(conf, 'test', 'environments\\.test');
    });

    it('rejects a lowercase ICAO', () => {
      expectError(makeConf({ aerodrome: makeAerodrome({ ICAO: 'lszt', runways: RUNWAYS }) }), 'test', 'aerodrome\\.ICAO');
    });

    it('rejects a missing aerodrome', () => {
      expectError(makeConf({ aerodrome: undefined }), 'test', 'aerodrome');
    });

    it('rejects runways given as a string', () => {
      expectError(makeConf({ aerodrome: makeAerodrome({ ICAO: 'LSZT', runways: '06,24' }) }), 'test', 'aerodrome\\.runways');
    });

    it('rejects empty runways', () => {
      expectError(makeConf({ aerodrome: makeAerodrome({ ICAO: 'LSZT', runways: [] }) }), 'test', 'aerodrome\\.runways');
    });

    it('rejects runways given as plain names', () => {
      expectError(makeConf({ aerodrome: makeAerodrome({ ICAO: 'LSZT', runways: ['06', '24'] }) }), 'test', 'aerodrome\\.runways');
    });

    it('rejects a runway without a name', () => {
      expectError(makeConf({ aerodrome: makeAerodrome({ ICAO: 'LSZT', runways: [{ name: '', type: 'G' }] }) }), 'test', 'aerodrome\\.runways');
    });

    it('rejects a runway with a non-string type', () => {
      expectError(makeConf({ aerodrome: makeAerodrome({ ICAO: 'LSZT', runways: [{ name: '06' }] }) }), 'test', 'aerodrome\\.runways');
    });

    it('rejects duplicate runway names', () => {
      const runways = [{ name: '06', type: 'G' }, { name: '06', type: 'A' }];
      expectError(makeConf({ aerodrome: makeAerodrome({ runways }) }), 'test', 'aerodrome\\.runways.*duplicate');
    });

    it('rejects a non-boolean memberManagement', () => {
      expectError(makeConf({ memberManagement: 'true' }), 'test', 'memberManagement');
    });

    it('rejects a non-boolean reportApiEnabled, also when set per environment', () => {
      expectError(makeConf({ reportApiEnabled: 1 }), 'test', 'reportApiEnabled');
      const conf = makeConf({}, {
        test: { firebaseProjectId: 'flightbox-test', reportApiEnabled: 'yes' },
        production: { firebaseProjectId: 'flightbox-prod' }
      });
      expectError(conf, 'test', 'reportApiEnabled');
      expect(buildServerConfig('lsxy', conf, 'production').reportApiEnabled).toBe(false);
    });

    it('rejects missing or malformed routes', () => {
      expectError(makeConf({ aerodrome: makeAerodrome({ departureRoutes: undefined }) }), 'test', 'aerodrome\\.departureRoutes');
      expectError(makeConf({ aerodrome: makeAerodrome({ arrivalRoutes: 'north' }) }), 'test', 'aerodrome\\.arrivalRoutes');
      expectError(makeConf({ aerodrome: makeAerodrome({ arrivalRoutes: ['north'] }) }), 'test', 'aerodrome\\.arrivalRoutes');
      expectError(makeConf({ aerodrome: makeAerodrome({ departureRoutes: [{ name: '' }] }) }), 'test', 'aerodrome\\.departureRoutes');
      const duplicate = [{ name: 'north' }, { name: 'north', label: 'Nord' }];
      expectError(makeConf({ aerodrome: makeAerodrome({ arrivalRoutes: duplicate }) }), 'test', 'aerodrome\\.arrivalRoutes.*duplicate');
    });

    it('rejects malformed enabledFlightTypes', () => {
      expectError(makeConf({ enabledFlightTypes: [] }), 'test', 'enabledFlightTypes');
      expectError(makeConf({ enabledFlightTypes: 'private' }), 'test', 'enabledFlightTypes');
      expectError(makeConf({ enabledFlightTypes: ['private', ''] }), 'test', 'enabledFlightTypes');
      expectError(makeConf({ enabledFlightTypes: ['private', 3] }), 'test', 'enabledFlightTypes');
    });

    it('rejects a malformed loginForm', () => {
      expectError(makeConf({ loginForm: '' }), 'test', 'loginForm');
      expectError(makeConf({ loginForm: true }), 'test', 'loginForm');
    });

    it('rejects a malformed centralLogin', () => {
      const centralLogin = {
        issuer: 'https://login.example.ch',
        jwksUri: 'https://login.example.ch/jwks',
        audience: 'flightbox-lsxy-test'
      };
      const inTest = value => makeConf({}, {
        test: { firebaseProjectId: 'flightbox-test', centralLogin: value },
        production: { firebaseProjectId: 'flightbox-prod' }
      });
      expectError(inTest('https://login.example.ch'), 'test', 'centralLogin');
      expectError(inTest({ ...centralLogin, issuer: 'http://login.example.ch' }), 'test', 'centralLogin');
      expectError(inTest({ ...centralLogin, audience: '' }), 'test', 'centralLogin');
      expectError(inTest({ issuer: centralLogin.issuer }), 'test', 'centralLogin');
    });

    it('rejects non-boolean lockOnDateTime and movementWritesViaApi', () => {
      expectError(makeConf({ lockOnDateTime: 'true' }), 'test', 'lockOnDateTime');
      expectError(makeConf({ movementWritesViaApi: 1 }), 'test', 'movementWritesViaApi');
      const conf = makeConf({}, {
        test: { firebaseProjectId: 'flightbox-test', movementWritesViaApi: 'yes' },
        production: { firebaseProjectId: 'flightbox-prod' }
      });
      expectError(conf, 'test', 'movementWritesViaApi');
      expect(buildServerConfig('lsxy', conf, 'production').movementWritesViaApi).toBe(false);
    });

    it.each(['enabledFlightTypes', 'loginForm', 'lockOnDateTime'])(
      'rejects %s set per environment (the database rules read the top level)',
      key => {
        const values = { enabledFlightTypes: ['private'], loginForm: 'email', lockOnDateTime: true };
        const conf = makeConf({}, {
          test: { firebaseProjectId: 'flightbox-test', [key]: values[key] },
          production: { firebaseProjectId: 'flightbox-prod' }
        });
        expectError(conf, 'test', `environments\\.test\\.${key}`);
        expect(() => buildServerConfig('lsxy', conf, 'production')).not.toThrow();
      }
    );

    describe('environment-level aerodrome with movementWritesViaApi', () => {
      const withTestAerodrome = (aerodrome, flags = { movementWritesViaApi: true }) => makeConf({}, {
        test: { firebaseProjectId: 'flightbox-test', aerodrome, ...flags },
        production: { firebaseProjectId: 'flightbox-prod' }
      });

      it.each([
        ['ICAO', { ICAO: 'LSXX' }],
        ['a runway name', { runways: [{ name: '36', type: 'A' }] }],
        ['an additional runway', { runways: [...RUNWAYS, { name: '18', type: 'A' }] }],
        ['a departure route name', { departureRoutes: [{ name: 'west', label: 'West' }] }],
        ['the arrival routes', { arrivalRoutes: [] }]
      ])('rejects one that changes %s (the database rules read the top level)', (label, overrides) => {
        const conf = withTestAerodrome(makeAerodrome(overrides));
        expectError(conf, 'test', 'environments\\.test\\.aerodrome.*movementWritesViaApi');
        expect(() => buildServerConfig('lsxy', conf, 'production')).not.toThrow();
      });

      it('rejects it when the flag is set at the top level', () => {
        const conf = { ...withTestAerodrome(makeAerodrome({ ICAO: 'LSXX' }), {}), movementWritesViaApi: true };
        expectError(conf, 'test', 'environments\\.test\\.aerodrome');
      });

      it('accepts one that changes only what the movement rules do not read', () => {
        const conf = withTestAerodrome(makeAerodrome({
          name: 'Lommis Test',
          runways: [{ name: '24', type: 'A' }, { name: '06', type: 'A' }],
          departureRoutes: [...DEPARTURE_ROUTES].reverse().map(route => ({ ...route, label: 'X' }))
        }));
        const actual = buildServerConfig('lsxy', conf, 'test');
        expect(actual.movementWritesViaApi).toBe(true);
        expect(actual.aerodrome.runways).toEqual([{ name: '24', type: 'A' }, { name: '06', type: 'A' }]);
      });

      it('keeps the override working while the flag is off', () => {
        const conf = withTestAerodrome(makeAerodrome({ ICAO: 'LSXX' }), { reportApiEnabled: true });
        expect(buildServerConfig('lsxy', conf, 'test').aerodrome.ICAO).toBe('LSXX');
      });
    });

    it('rejects a missing firebaseProjectId', () => {
      expectError(makeConf({}, { test: {} }), 'test', 'firebaseProjectId');
      expectError(makeConf({}, { test: { firebaseProjectId: '' } }), 'test', 'firebaseProjectId');
    });
  });

  describe('main', () => {
    let dir;
    let consoleError;

    beforeEach(() => {
      dir = fs.mkdtempSync(path.join(os.tmpdir(), 'server-config-'));
      consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleError.mockRestore();
      fs.rmSync(dir, { recursive: true, force: true });
    });

    it('writes the config of a project and environment as JSON', () => {
      const out = path.join(dir, 'config.json');
      expect(main(['lsze', 'production', out])).toBe(0);
      expect(JSON.parse(fs.readFileSync(out, 'utf8'))).toEqual(buildServerConfigFor('lsze', 'production'));
    });

    it('fails without writing for an invalid config', () => {
      const out = path.join(dir, 'config.json');
      expect(main(['lsze', 'staging', out])).toBe(1);
      expect(fs.existsSync(out)).toBe(false);
      expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('env must be one of'));
    });

    it('checks the Firebase project when one is expected', () => {
      const out = path.join(dir, 'config.json');
      expect(main(['lsze', 'test', out, 'lsze-test'])).toBe(0);
      fs.rmSync(out);
      expect(main(['lsze', 'test', out, 'lsze-prod'])).toBe(1);
      expect(fs.existsSync(out)).toBe(false);
      expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('"lsze-test", not "lsze-prod"'));
    });

    it('prints the usage for missing arguments', () => {
      expect(main(['lsze', 'test'])).toBe(1);
      expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('Usage'));
    });
  });
});
