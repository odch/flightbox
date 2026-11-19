const { packinize } = require('./index');

describe('packinize', () => {
  it('turns strings into DefinePlugin code and keeps other values', () => {
    expect(packinize({ name: 'LSPL', ppr: true, port: 8080 })).toEqual({ name: '"LSPL"', ppr: true, port: 8080 });
  });

  it('packs nested objects', () => {
    expect(packinize({ aerodrome: { name: 'Langenthal' } })).toEqual({ aerodrome: { name: '"Langenthal"' } });
  });

  // An environment can set null to drop a top-level value (e.g.
  // pprGuestRequests), which tasks/generatePprConfig.js takes as unset
  it('keeps null', () => {
    expect(packinize({ pprGuestRequests: null, aerodrome: { logo: null } }))
      .toEqual({ pprGuestRequests: null, aerodrome: { logo: null } });
  });
});

describe('load', () => {
  const fs = require('fs');
  const path = require('path');
  const { load } = require('./index');

  // Serves the given project files instead of the real ones.
  function withProjects(files) {
    const real = fs.readFileSync;
    jest.spyOn(fs, 'readFileSync').mockImplementation((file, ...args) => {
      const name = path.basename(String(file), '.json');
      if (path.dirname(String(file)) === __dirname && Object.prototype.hasOwnProperty.call(files, name)) {
        return JSON.stringify(files[name]);
      }
      return real(file, ...args);
    });
  }

  afterEach(() => jest.restoreAllMocks());

  it('merges the project over projects/default.json', () => {
    withProjects({ default: { loginForm: 'username', title: 'Default' }, lsxx: { title: 'X' } });
    expect(load('lsxx')).toEqual({ loginForm: 'username', title: 'X' });
  });

  it('lets a project extend another one, merging environments by name', () => {
    withProjects({
      default: { loginForm: 'username' },
      base: {
        title: 'Base',
        aerodrome: { ICAO: 'LSXX', runways: [] },
        environments: {
          test: { firebaseProjectId: 'base-test', passkeysEnabled: true },
          production: { firebaseProjectId: 'base-prod' },
        },
      },
      variant: {
        extends: 'base',
        title: 'Variant',
        environments: { test: { movementWritesViaApi: true } },
      },
    });

    expect(load('variant')).toEqual({
      loginForm: 'username',
      title: 'Variant',
      aerodrome: { ICAO: 'LSXX', runways: [] },
      environments: {
        test: { firebaseProjectId: 'base-test', passkeysEnabled: true, movementWritesViaApi: true },
        production: { firebaseProjectId: 'base-prod' },
      },
    });
  });

  it('replaces a top-level object of the base as a whole', () => {
    withProjects({
      default: {},
      base: { aerodrome: { ICAO: 'LSXX', runways: [{ name: '36' }] } },
      variant: { extends: 'base', aerodrome: { ICAO: 'LSYY' } },
    });
    expect(load('variant').aerodrome).toEqual({ ICAO: 'LSYY' });
  });

  it('rejects an invalid or circular "extends"', () => {
    withProjects({
      default: {},
      a: { extends: 'b' },
      b: { extends: 'a' },
      self: { extends: 'self' },
      number: { extends: 3 },
      toDefault: { extends: 'default' },
    });
    expect(() => load('a')).toThrow('circular "extends" (a -> b -> a)');
    expect(() => load('self')).toThrow('circular "extends"');
    expect(() => load('number')).toThrow('"extends" must name another project');
    expect(() => load('toDefault')).toThrow('"extends" must name another project');
  });

  it('builds cypress-testing-api from cypress-testing with movement writes via the API', () => {
    const { environments: baseEnvs, title: baseTitle, ...base } = load('cypress-testing');
    const { environments: envs, title, ...variant } = load('cypress-testing-api');

    expect(variant).toEqual(base);
    expect(title).not.toEqual(baseTitle);
    expect(envs).toEqual({ test: { ...baseEnvs.test, movementWritesViaApi: true } });
    expect(baseEnvs.test.movementWritesViaApi).toBeUndefined();
  });
});
