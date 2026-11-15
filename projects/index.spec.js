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
