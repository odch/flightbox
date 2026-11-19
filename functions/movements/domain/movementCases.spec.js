'use strict';

const { VARIANT_NAMES, loadVariant } = require('./testing/projectPolicies');
const { buildCases } = require('./testing/movementCases');
const { decide } = require('./testing/decide');

// The case table shared with the emulator parity run
// (test/rules/movementDomainParity.rules.js), for real project policies:
// lsze and lszt (personal access), lspv (shared access) and lsze with the
// ISO lock.
describe('movement domain', () => {
  describe.each(VARIANT_NAMES)('cases for %s', variantName => {
    const { policy } = loadVariant(variantName);
    const cases = buildCases(policy);

    it('has unique case names', () => {
      expect(new Set(cases.map(testCase => testCase.name)).size).toBe(cases.length);
    });

    it.each(cases.map(testCase => [testCase.name, testCase]))('%s', (name, testCase) => {
      const decision = decide(policy, testCase);
      expect(decision.errors).toEqual(testCase.expected.errors);
      expect(decision.access).toEqual(testCase.expected.access);
      expect(decision.ok).toBe(testCase.expected.errors.length === 0 && testCase.expected.access.ok);
    });
  });
});
