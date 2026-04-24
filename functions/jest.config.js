// Jest 24 predates Node's `exports` field support in package.json.
// firebase-functions@6 exposes gen1 APIs only via its `./v1` export
// subpath, which jest-resolve cannot follow without an explicit map.
// Remove this mapping once jest is upgraded to 28+.
module.exports = {
  moduleNameMapper: {
    '^firebase-functions/v1$':
      '<rootDir>/node_modules/firebase-functions/lib/v1/index.js',
  },
};
