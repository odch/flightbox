const fs = require('fs');
const path = require('path');
const projects = require('../projects');
const objectToArray = require('../src/util/objectToArray').default;
const os = require('os');
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

function makeConf(overrides = {}, environments) {
  return {
    aerodrome: { ICAO: 'LSZT', name: 'Lommis', runways: RUNWAYS },
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
      aerodrome: {
        ICAO: client.aerodrome.ICAO,
        runways: objectToArray(client.aerodrome.runways).map(({ name, type }) => ({ name, type }))
      }
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
          aerodrome: { ICAO: 'LSXX', runways: [{ name: '36', type: 'A' }] }
        },
        production: { firebaseProjectId: 'flightbox-prod' }
      });
      expect(buildServerConfig('lszt', conf, 'test').aerodrome).toEqual({
        ICAO: 'LSXX',
        runways: [{ name: '36', type: 'A' }]
      });
      expect(buildServerConfig('lszt', conf, 'production').aerodrome).toEqual({
        ICAO: 'LSZT',
        runways: RUNWAYS
      });
    });

    it('drops runway fields other than name and type', () => {
      const conf = makeConf({
        aerodrome: { ICAO: 'LSZT', runways: [{ name: '06', type: 'G', length: 500 }] }
      });
      expect(buildServerConfig('lszt', conf, 'test').aerodrome.runways).toEqual([{ name: '06', type: 'G' }]);
    });

    it('orders runways like objectToArray(packinize(...)) beyond ten entries', () => {
      const runways = Array.from({ length: 12 }, (_, i) => ({ name: `R${i}`, type: 'A' }));
      const conf = makeConf({ aerodrome: { ICAO: 'LSZT', runways } });
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
      expectError(makeConf({ aerodrome: { ICAO: 'lszt', runways: RUNWAYS } }), 'test', 'aerodrome\\.ICAO');
    });

    it('rejects a missing aerodrome', () => {
      expectError(makeConf({ aerodrome: undefined }), 'test', 'aerodrome');
    });

    it('rejects runways given as a string', () => {
      expectError(makeConf({ aerodrome: { ICAO: 'LSZT', runways: '06,24' } }), 'test', 'aerodrome\\.runways');
    });

    it('rejects empty runways', () => {
      expectError(makeConf({ aerodrome: { ICAO: 'LSZT', runways: [] } }), 'test', 'aerodrome\\.runways');
    });

    it('rejects runways given as plain names', () => {
      expectError(makeConf({ aerodrome: { ICAO: 'LSZT', runways: ['06', '24'] } }), 'test', 'aerodrome\\.runways');
    });

    it('rejects a runway without a name', () => {
      expectError(makeConf({ aerodrome: { ICAO: 'LSZT', runways: [{ name: '', type: 'G' }] } }), 'test', 'aerodrome\\.runways');
    });

    it('rejects a runway with a non-string type', () => {
      expectError(makeConf({ aerodrome: { ICAO: 'LSZT', runways: [{ name: '06' }] } }), 'test', 'aerodrome\\.runways');
    });

    it('rejects duplicate runway names', () => {
      const runways = [{ name: '06', type: 'G' }, { name: '06', type: 'A' }];
      expectError(makeConf({ aerodrome: { ICAO: 'LSZT', runways } }), 'test', 'aerodrome\\.runways.*duplicate');
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
