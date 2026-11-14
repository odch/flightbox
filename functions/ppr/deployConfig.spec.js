'use strict'

const { loadPprConfig, pprBranding } = require('./deployConfig')

const ENV = { GCLOUD_PROJECT: 'lspl-test' }

const CONFIG = {
  enabled: true,
  firebaseProjectId: 'lspl-test',
  aerodromeName: 'Langenthal',
  themeColor: '#027ABB'
}

const missingFile = () => {
  const error = new Error("Cannot find module '../ppr-config.generated.js'")
  error.code = 'MODULE_NOT_FOUND'
  throw error
}

describe('PPR deployConfig', () => {
  describe('loadPprConfig', () => {
    it('returns the config written for the project the functions run in', () => {
      expect(loadPprConfig(() => CONFIG, ENV)).toBe(CONFIG)
    })

    it('also finds the project in FIREBASE_CONFIG', () => {
      const env = { FIREBASE_CONFIG: JSON.stringify({ projectId: 'lspl-test' }) }
      expect(loadPprConfig(() => CONFIG, env)).toBe(CONFIG)
    })

    it('returns the config also when PPR is off there', () => {
      const config = { ...CONFIG, enabled: false }
      expect(loadPprConfig(() => config, ENV)).toBe(config)
    })

    it('has no config when the deploy did not write the file', () => {
      expect(loadPprConfig(missingFile, ENV)).toBeNull()
    })

    it('ignores a config written for another project (e.g. left over from local work)', () => {
      expect(loadPprConfig(() => ({ ...CONFIG, firebaseProjectId: 'lspl-prod' }), ENV)).toBeNull()
      expect(loadPprConfig(() => CONFIG, {})).toBeNull()
    })

    it.each([
      ['without project', { enabled: true }],
      ['with an empty project', { enabled: true, firebaseProjectId: '' }],
      ['the old boolean format', true],
      ['empty', null]
    ])('ignores a config that is %s', (name, config) => {
      expect(loadPprConfig(() => config, ENV)).toBeNull()
    })

    it('does not hide other errors in the file', () => {
      const broken = () => { throw new SyntaxError('Unexpected token') }
      expect(() => loadPprConfig(broken, ENV)).toThrow(SyntaxError)
    })

    it('reads functions/ppr-config.generated.js by default', () => {
      // Mocked, so a file in a working copy cannot affect the test
      jest.isolateModules(() => {
        jest.doMock('../ppr-config.generated.js', () => CONFIG, { virtual: true })
        const { loadPprConfig: load, pprBranding: branding } = require('./deployConfig')
        expect(load(undefined, ENV)).toEqual(CONFIG)
        expect(branding(undefined, ENV)).toEqual({ aerodromeName: 'Langenthal', themeColor: '#027ABB' })
      })
    })
  })

  describe('pprBranding', () => {
    it('has the aerodrome name and theme colour of the project', () => {
      expect(pprBranding(() => CONFIG, ENV)).toEqual({ aerodromeName: 'Langenthal', themeColor: '#027ABB' })
    })

    it('has no name and the default colour without a config', () => {
      const unbranded = { aerodromeName: '', themeColor: '#000000' }
      expect(pprBranding(missingFile, ENV)).toEqual(unbranded)
      expect(pprBranding(() => CONFIG, { GCLOUD_PROJECT: 'lspl-prod' })).toEqual(unbranded)
    })

    it('has no name and the default colour when the project sets none', () => {
      const config = { enabled: true, firebaseProjectId: 'lspl-test' }
      expect(pprBranding(() => config, ENV)).toEqual({ aerodromeName: '', themeColor: '#000000' })
    })

    it('replaces an invalid colour with the default', () => {
      const config = { ...CONFIG, themeColor: 'red; } </style><script>alert(1)</script>' }
      expect(pprBranding(() => config, ENV).themeColor).toBe('#000000')
    })

    it.each([['blank', '  '], ['no string', 42]])('has no name for a name that is %s', (name, aerodromeName) => {
      expect(pprBranding(() => ({ ...CONFIG, aerodromeName }), ENV).aerodromeName).toBe('')
    })

    it('trims the name', () => {
      expect(pprBranding(() => ({ ...CONFIG, aerodromeName: ' Langenthal ' }), ENV).aerodromeName).toBe('Langenthal')
    })
  })

  describe('pprAppOrigin', () => {
    let consoleError

    // pprAppOrigin logs an invalid value once per module instance
    function loadPprAppOrigin() {
      let pprAppOrigin
      jest.isolateModules(() => {
        pprAppOrigin = require('./deployConfig').pprAppOrigin
      })
      return pprAppOrigin
    }

    const withAppUrl = appUrl => () => ({ ...CONFIG, appUrl })

    beforeEach(() => {
      consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
      consoleError.mockRestore()
    })

    it('returns the origin of the app URL', () => {
      const pprAppOrigin = loadPprAppOrigin()
      expect(pprAppOrigin(withAppUrl('https://lspl-test.web.app'), ENV)).toBe('https://lspl-test.web.app')
      expect(pprAppOrigin(withAppUrl('https://LSPL-test.web.app/'), ENV)).toBe('https://lspl-test.web.app')
      expect(consoleError).not.toHaveBeenCalled()
    })

    it('is null without an app URL, and logs nothing', () => {
      const pprAppOrigin = loadPprAppOrigin()
      expect(pprAppOrigin(() => CONFIG, ENV)).toBeNull()
      expect(pprAppOrigin(withAppUrl(null), ENV)).toBeNull()
      expect(pprAppOrigin(missingFile, ENV)).toBeNull()
      expect(consoleError).not.toHaveBeenCalled()
    })

    it('is null for the config of another project', () => {
      const pprAppOrigin = loadPprAppOrigin()
      expect(pprAppOrigin(withAppUrl('https://lspl-test.web.app'), { GCLOUD_PROJECT: 'lspl-prod' })).toBeNull()
      expect(consoleError).not.toHaveBeenCalled()
    })

    it.each([
      ['http', 'http://lspl-test.web.app'],
      ['a path', 'https://lspl-test.web.app/app'],
      ['a query', 'https://lspl-test.web.app/?tab=ppr'],
      ['a fragment', 'https://lspl-test.web.app/#/admin'],
      ['credentials', 'https://admin:secret@lspl-test.web.app'],
      ['an empty string', ''],
      ['no string', 42]
    ])('is null for an app URL with %s, and logs that links are left out', (name, appUrl) => {
      const pprAppOrigin = loadPprAppOrigin()
      expect(pprAppOrigin(withAppUrl(appUrl), ENV)).toBeNull()
      expect(consoleError).toHaveBeenCalledTimes(1)
      expect(consoleError.mock.calls[0][0]).toContain('without links to the app')
      expect(consoleError.mock.calls[0].join(' ')).not.toContain('secret')
    })

    it('logs an invalid app URL only once', () => {
      const pprAppOrigin = loadPprAppOrigin()
      for (let i = 0; i < 3; i++) {
        expect(pprAppOrigin(withAppUrl('http://lspl-test.web.app'), ENV)).toBeNull()
      }
      expect(consoleError).toHaveBeenCalledTimes(1)
    })

    it('reads functions/ppr-config.generated.js by default', () => {
      jest.isolateModules(() => {
        jest.doMock('../ppr-config.generated.js', withAppUrl('https://lspl-test.web.app'), { virtual: true })
        const { pprAppOrigin } = require('./deployConfig')
        expect(pprAppOrigin(undefined, ENV)).toBe('https://lspl-test.web.app')
      })
    })
  })
})
