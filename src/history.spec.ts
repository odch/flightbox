describe('history', () => {
  afterEach(() => {
    window.history.replaceState(null, '', '/');
  });

  const loadHistory = () => {
    let module: typeof import('./history') | undefined;
    jest.isolateModules(() => {
      module = require('./history');
    });
    return module!.history;
  };

  it('starts on the PPR request when the app is opened with its short link', () => {
    window.history.replaceState(null, '', '/ppr');
    expect(loadHistory().location.pathname).toBe('/ppr/new');
  });

  it('starts on the route of the fragment otherwise', () => {
    window.history.replaceState(null, '', '/#/movements');
    expect(loadHistory().location.pathname).toBe('/movements');
  });
});
