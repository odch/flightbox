const fs = require('fs');
const os = require('os');
const path = require('path');
const projects = require('../projects');
const { sanitizeThemeColor } = require('../functions/email/themeColor');
const {
  buildPprConfig,
  buildPprConfigFor,
  formatPprConfig,
  pprConfigWarnings,
  main
} = require('./generatePprConfig');

const PROJECTS_DIR = path.resolve(__dirname, '../projects');

// Every tenant project file, enumerated so a new tenant is covered as well.
const PROJECT_NAMES = fs.readdirSync(PROJECTS_DIR)
  .filter(file => file.endsWith('.json') && file !== 'default.json')
  .map(file => file.replace(/\.json$/, ''))
  .sort();

const CASES = PROJECT_NAMES.flatMap(project =>
  Object.keys(projects.load(project).environments).map(env => [project, env])
);

// What the client's __CONF__ holds (webpack.config.js:11-16)
function clientConf(project, env) {
  const { environments, ...rest } = projects.load(project);
  return { ...rest, ...environments[env] };
}

// Runs the generated file as the functions require it
function evaluate(source) {
  const module = { exports: undefined };
  new Function('module', source)(module);
  return module.exports;
}

function makeConf(overrides = {}, environments) {
  return {
    aerodrome: { ICAO: 'LSPL', name: 'Langenthal' },
    themeColor: '#027ABB',
    ppr: false,
    environments: environments || {
      test: { firebaseProjectId: 'lspl-test', ppr: true, appUrl: 'https://lspl-test.web.app' },
      production: { firebaseProjectId: 'lspl-prod' }
    },
    ...overrides
  };
}

describe('tasks/generatePprConfig', () => {
  it('finds tenant projects, each with at least one environment', () => {
    expect(PROJECT_NAMES.length).toBeGreaterThan(0);
    expect(PROJECT_NAMES).not.toContain('default');
    PROJECT_NAMES.forEach(project => {
      expect(CASES.some(([name]) => name === project)).toBe(true);
    });
  });

  // Every project/env the deploy can be run for must build, with the values
  // the client reads from __CONF__, in a form the functions use as it is.
  it.each(CASES)('%s / %s builds from the client __CONF__ values', (project, env) => {
    const client = clientConf(project, env);
    const config = buildPprConfigFor(project, env, 'firebase-project');

    expect(config).toEqual({
      enabled: client.ppr === true,
      firebaseProjectId: 'firebase-project',
      aerodromeName: client.aerodrome && client.aerodrome.name,
      themeColor: client.themeColor,
      appUrl: client.appUrl && new URL(client.appUrl).origin
    });
    if (config.themeColor !== undefined) {
      expect(sanitizeThemeColor(config.themeColor)).toBe(config.themeColor);
    }
    expect(evaluate(formatPprConfig(config))).toEqual(config);
  });

  it('builds the file of lspl, where PPR is on in test only', () => {
    expect(formatPprConfig(buildPprConfigFor('lspl', 'test', 'lspl-test'))).toBe(
      'module.exports = {"enabled":true,"firebaseProjectId":"lspl-test",'
      + '"aerodromeName":"Langenthal","themeColor":"#027ABB","appUrl":"https://lspl-test.web.app"};\n'
    );
    expect(buildPprConfigFor('lspl', 'production', 'lspl-prod')).toEqual({
      enabled: false,
      firebaseProjectId: 'lspl-prod',
      aerodromeName: 'Langenthal',
      themeColor: '#027ABB'
    });
  });

  it('builds the file of a project without theme colour (cypress-testing)', () => {
    expect(formatPprConfig(buildPprConfigFor('cypress-testing', 'test', 'cypress-testing'))).toBe(
      'module.exports = {"enabled":false,"firebaseProjectId":"cypress-testing","aerodromeName":"Cypress"};\n'
    );
  });

  describe('buildPprConfig', () => {
    it('has every field', () => {
      expect(buildPprConfig('lspl', makeConf(), 'test', 'lspl-test')).toStrictEqual({
        enabled: true,
        firebaseProjectId: 'lspl-test',
        aerodromeName: 'Langenthal',
        themeColor: '#027ABB',
        appUrl: 'https://lspl-test.web.app'
      });
    });

    it('takes the Firebase project from the deploy', () => {
      expect(buildPprConfig('lspl', makeConf(), 'production', 'other-project').firebaseProjectId)
        .toBe('other-project');
    });

    it('is enabled only for ppr === true', () => {
      const withPpr = ppr => makeConf({ ppr }, { test: { firebaseProjectId: 'x' } });
      expect(buildPprConfig('lspl', withPpr(true), 'test', 'x').enabled).toBe(true);
      expect(buildPprConfig('lspl', withPpr('true'), 'test', 'x').enabled).toBe(false);
      expect(buildPprConfig('lspl', withPpr(undefined), 'test', 'x').enabled).toBe(false);
    });

    it('lets an environment override every value', () => {
      const conf = makeConf({ appUrl: 'https://flightbox.example' }, {
        test: {
          ppr: true,
          aerodrome: { ICAO: 'LSXX', name: 'Test' },
          themeColor: 'red',
          appUrl: 'https://test.example'
        },
        production: {}
      });
      expect(buildPprConfig('lspl', conf, 'test', 'x')).toEqual({
        enabled: true,
        firebaseProjectId: 'x',
        aerodromeName: 'Test',
        themeColor: 'red',
        appUrl: 'https://test.example'
      });
      expect(buildPprConfig('lspl', conf, 'production', 'x')).toEqual({
        enabled: false,
        firebaseProjectId: 'x',
        aerodromeName: 'Langenthal',
        themeColor: '#027ABB',
        appUrl: 'https://flightbox.example'
      });
    });

    it('lets an environment drop a value with null', () => {
      const conf = makeConf({ appUrl: 'https://flightbox.example' }, {
        test: { appUrl: null, themeColor: null }
      });
      const config = buildPprConfig('lspl', conf, 'test', 'x');
      expect(config.appUrl).toBeUndefined();
      expect(config.themeColor).toBeUndefined();
    });

    it('normalises the app URL to its origin', () => {
      const withUrl = appUrl => makeConf({ appUrl }, { test: {} });
      expect(buildPprConfig('lspl', withUrl('https://LSPL-test.web.app/'), 'test', 'x').appUrl)
        .toBe('https://lspl-test.web.app');
      expect(buildPprConfig('lspl', withUrl('https://flightbox.example:443'), 'test', 'x').appUrl)
        .toBe('https://flightbox.example');
    });

    it('leaves out the values a project does not set', () => {
      const conf = makeConf({ aerodrome: { ICAO: 'LSXX' }, themeColor: undefined }, { test: {} });
      expect(formatPprConfig(buildPprConfig('lsxx', conf, 'test', 'x')))
        .toBe('module.exports = {"enabled":false,"firebaseProjectId":"x"};\n');
      const { aerodrome, ...withoutAerodrome } = conf;
      expect(formatPprConfig(buildPprConfig('lsxx', withoutAerodrome, 'test', 'x')))
        .toBe('module.exports = {"enabled":false,"firebaseProjectId":"x"};\n');
    });

    it('does not mutate its input', () => {
      const conf = makeConf();
      const copy = JSON.parse(JSON.stringify(conf));
      buildPprConfig('lspl', conf, 'test', 'x');
      expect(conf).toEqual(copy);
    });
  });

  describe('validation', () => {
    const expectError = (conf, env, field) => {
      expect(() => buildPprConfig('lsxy', conf, env, 'x')).toThrow(
        expect.objectContaining({
          message: expect.stringMatching(new RegExp(`^Invalid PPR config for project "lsxy" \\(env "${env}"\\): ${field}`))
        })
      );
    };
    const withTest = values => makeConf(values, { test: {} });

    it('rejects an unknown env name', () => {
      expectError(makeConf(), 'staging', 'env must be one of test, production');
    });

    it('rejects a missing environment', () => {
      expectError(makeConf({}, { test: {} }), 'production', 'environments\\.production is not defined');
    });

    it('rejects missing environments', () => {
      const { environments, ...conf } = makeConf();
      expectError(conf, 'test', 'environments\\.test is not defined');
    });

    it.each([undefined, '', 42])('rejects the Firebase project %p', firebaseProjectId => {
      expect(() => buildPprConfig('lsxy', makeConf(), 'test', firebaseProjectId)).toThrow(
        'Invalid PPR config for project "lsxy" (env "test"): Firebase project must be a non-empty string'
      );
    });

    it.each(['', 'rgb(2, 122, 187)', '027ABB', '#12', 'red; background: url(x)', 42, true])(
      'rejects the theme colour %p', themeColor => {
        expectError(withTest({ themeColor }), 'test', 'themeColor must be a hex colour or a colour name');
      }
    );

    it('rejects an invalid theme colour set by an environment', () => {
      expectError(makeConf({}, { test: { themeColor: 'not a colour' } }), 'test', 'themeColor');
    });

    it.each([
      ['http', 'http://lspl-test.web.app'],
      ['a path', 'https://lspl-test.web.app/app'],
      ['a query', 'https://lspl-test.web.app/?tab=ppr'],
      ['a fragment', 'https://lspl-test.web.app/#/admin'],
      ['credentials', 'https://admin:secret@lspl-test.web.app'],
      ['no URL', 'lspl-test.web.app'],
      ['an empty string', ''],
      ['no string', 42]
    ])('rejects an app URL with %s', (name, appUrl) => {
      expectError(withTest({ appUrl }), 'test', 'appUrl must be an https origin');
    });

    it('rejects an invalid app URL set by an environment', () => {
      expectError(makeConf({}, { test: { appUrl: 'http://lspl-test.web.app' } }), 'test', 'appUrl');
    });

    it.each(['', '  ', 42, ['Langenthal']])('rejects the aerodrome name %p', name => {
      expectError(withTest({ aerodrome: { ICAO: 'LSPL', name } }), 'test', 'aerodrome\\.name must be a non-empty string');
    });

    it('rejects an aerodrome that is no object', () => {
      expectError(withTest({ aerodrome: 'Langenthal' }), 'test', 'aerodrome must be an object');
    });
  });

  describe('pprConfigWarnings', () => {
    const config = fields => ({ enabled: true, firebaseProjectId: 'lspl-test', ...fields });

    it('points out a missing app URL where PPR is on', () => {
      expect(pprConfigWarnings('lspl', 'test', config({}))).toEqual([
        'PPR is on for project "lspl" (env "test"), but appUrl is not set:'
          + ' the aerodrome\'s emails have no link to the requests'
      ]);
    });

    it('has nothing to point out with an app URL, or where PPR is off', () => {
      expect(pprConfigWarnings('lspl', 'test', config({ appUrl: 'https://lspl-test.web.app' }))).toEqual([]);
      expect(pprConfigWarnings('lspl', 'production', config({ enabled: false }))).toEqual([]);
    });
  });

  describe('main', () => {
    let dir;
    let consoleError;

    beforeEach(() => {
      dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ppr-config-'));
      consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleError.mockRestore();
      fs.rmSync(dir, { recursive: true, force: true });
    });

    it('writes the config of a project and environment as a module', () => {
      const out = path.join(dir, 'ppr-config.generated.js');
      expect(main(['lspl', 'test', out, 'lspl-test'])).toBe(0);
      const source = fs.readFileSync(out, 'utf8');
      expect(source).toBe(formatPprConfig(buildPprConfigFor('lspl', 'test', 'lspl-test')));
      expect(evaluate(source)).toEqual(buildPprConfigFor('lspl', 'test', 'lspl-test'));
    });

    it('fails without writing for an invalid config', () => {
      const out = path.join(dir, 'ppr-config.generated.js');
      expect(main(['lspl', 'staging', out, 'lspl-test'])).toBe(1);
      expect(fs.existsSync(out)).toBe(false);
      expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('env must be one of'));
    });

    it('fails for an unknown project', () => {
      const out = path.join(dir, 'ppr-config.generated.js');
      expect(main(['lsxx', 'test', out, 'lsxx-test'])).toBe(1);
      expect(fs.existsSync(out)).toBe(false);
    });

    describe('warnings', () => {
      let consoleWarn;

      beforeEach(() => {
        consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      });

      afterEach(() => {
        consoleWarn.mockRestore();
        jest.restoreAllMocks();
      });

      it('writes the config, but warns, where PPR is on without an app URL', () => {
        jest.spyOn(projects, 'load').mockReturnValue(makeConf({}, {
          test: { firebaseProjectId: 'lspl-test', ppr: true }
        }));
        const out = path.join(dir, 'ppr-config.generated.js');

        expect(main(['lspl', 'test', out, 'lspl-test'])).toBe(0);

        expect(evaluate(fs.readFileSync(out, 'utf8'))).toMatchObject({ enabled: true, firebaseProjectId: 'lspl-test' });
        expect(consoleWarn).toHaveBeenCalledTimes(1);
        expect(consoleWarn).toHaveBeenCalledWith(expect.stringContaining('appUrl is not set'));
      });

      it('does not warn for lspl, which sets the app URL where PPR is on', () => {
        expect(main(['lspl', 'test', path.join(dir, 'test.js'), 'lspl-test'])).toBe(0);
        expect(main(['lspl', 'production', path.join(dir, 'production.js'), 'lspl-prod'])).toBe(0);
        expect(consoleWarn).not.toHaveBeenCalled();
      });
    });

    it.each([
      [['lspl', 'test', 'out.js']],
      [['lspl', 'test', 'out.js', 'lspl-test', 'extra']]
    ])('prints the usage for the arguments %p', args => {
      expect(main(args)).toBe(1);
      expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('Usage'));
    });
  });
});
