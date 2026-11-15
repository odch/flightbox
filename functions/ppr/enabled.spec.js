'use strict'

const { isPprEnabled, isPprGuestRequestsEnabled } = require('./enabled')

const ENV = { GCLOUD_PROJECT: 'flightbox-lsze' }

const missingFlagFile = () => {
  const error = new Error("Cannot find module '../ppr-config.generated.js'")
  error.code = 'MODULE_NOT_FOUND'
  throw error
}

describe('isPprEnabled', () => {
  it('is off when the deploy did not write the flag file', () => {
    expect(isPprEnabled(missingFlagFile, ENV)).toBe(false)
  })

  it('is on when enabled for the project the functions run in', () => {
    expect(isPprEnabled(() => ({ enabled: true, firebaseProjectId: 'flightbox-lsze' }), ENV)).toBe(true)
  })

  it('also finds the project in FIREBASE_CONFIG', () => {
    const env = { FIREBASE_CONFIG: JSON.stringify({ projectId: 'flightbox-lsze' }) }
    expect(isPprEnabled(() => ({ enabled: true, firebaseProjectId: 'flightbox-lsze' }), env)).toBe(true)
  })

  it('ignores a flag written for another project (e.g. left over from local work)', () => {
    expect(isPprEnabled(() => ({ enabled: true, firebaseProjectId: 'flightbox-test' }), ENV)).toBe(false)
  })

  it.each([
    ['disabled', { enabled: false, firebaseProjectId: 'flightbox-lsze' }],
    ['without project', { enabled: true }],
    ['the old boolean format', true],
    ['empty', null]
  ])('is off for a flag that is %s', (name, flag) => {
    expect(isPprEnabled(() => flag, ENV)).toBe(false)
  })

  it('does not hide other errors in the flag file', () => {
    const broken = () => { throw new SyntaxError('Unexpected token') }
    expect(() => isPprEnabled(broken, ENV)).toThrow(SyntaxError)
  })

  it('reads functions/ppr-config.generated.js by default', () => {
    // Mocked, so a flag file in a working copy cannot affect the test
    jest.isolateModules(() => {
      jest.doMock('../ppr-config.generated.js', () => ({ enabled: true, firebaseProjectId: 'flightbox-lsze' }), { virtual: true })
      const { isPprEnabled: isEnabled } = require('./enabled')
      expect(isEnabled(undefined, ENV)).toBe(true)
    })
  })
})

describe('isPprGuestRequestsEnabled', () => {
  const config = fields => () => ({ enabled: true, guestRequests: true, firebaseProjectId: 'flightbox-lsze', ...fields })

  it('is on where PPR and requests without login are on for this project', () => {
    expect(isPprGuestRequestsEnabled(config({}), ENV)).toBe(true)
  })

  it.each([
    ['PPR is off', { enabled: false }],
    ['requests without login are off', { guestRequests: false }],
    ['the file predates the flag', { guestRequests: undefined }],
    ['the flag is no boolean', { guestRequests: 'true' }],
    ['the file is for another project', { firebaseProjectId: 'flightbox-test' }]
  ])('is off when %s', (name, fields) => {
    expect(isPprGuestRequestsEnabled(config(fields), ENV)).toBe(false)
  })

  it('is off without the file', () => {
    expect(isPprGuestRequestsEnabled(missingFlagFile, ENV)).toBe(false)
  })

  it('reads functions/ppr-config.generated.js by default', () => {
    jest.isolateModules(() => {
      jest.doMock('../ppr-config.generated.js', config({}), { virtual: true })
      const { isPprGuestRequestsEnabled: isEnabled } = require('./enabled')
      expect(isEnabled(undefined, ENV)).toBe(true)
    })
  })
})
