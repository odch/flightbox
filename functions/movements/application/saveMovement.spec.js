'use strict';

const { saveMovement } = require('./saveMovement');
const { loadVariant } = require('../domain/testing/projectPolicies');
const { ACTORS, departureInput, stored } = require('../domain/testing/movementCases');

const LOCKED = { lockDate: Date.parse('2026-12-01T00:00:00.000Z'), lockDateIso: null, customsBaseUrl: null };

function repositoryWith({ existing = null, settings = {} } = {}) {
  return {
    findMovement: jest.fn(async () => existing),
    loadWriteSettings: jest.fn(async () => ({ lockDate: null, lockDateIso: null, customsBaseUrl: null, ...settings })),
    createMovement: jest.fn(async () => '-Nnew'),
    updateMovement: jest.fn(async () => undefined),
  };
}

describe('functions', () => {
  describe('movements/application/saveMovement', () => {
    const { policy } = loadVariant('lsze');
    const save = (repository, props) =>
      saveMovement({ repository, policy, actor: ACTORS.pilot, type: 'departure', ...props });

    it('creates and reports the new key', async () => {
      const repository = repositoryWith();

      expect(await save(repository, { input: departureInput(policy) })).toEqual({ ok: true, key: '-Nnew', created: true });
      expect(repository.findMovement).not.toHaveBeenCalled();
    });

    it('updates with the patch and keeps the key', async () => {
      const repository = repositoryWith({ existing: stored('departure', policy, { createdBy: ACTORS.pilot.email }) });

      expect(await save(repository, { key: 'k1', input: { remarks: 'x' } })).toEqual({ ok: true, key: 'k1', created: false });
      expect(repository.updateMovement).toHaveBeenCalledWith(
        'departure', 'k1', expect.objectContaining({ remarks: 'x' }), ACTORS.pilot);
    });

    it('reports a missing movement', async () => {
      const repository = repositoryWith();

      expect(await save(repository, { key: 'k1', input: {} })).toEqual({ ok: false, code: 'not-found', reason: 'not-found' });
      expect(repository.updateMovement).not.toHaveBeenCalled();
    });

    it('prefers validation errors over the lock', async () => {
      const repository = repositoryWith({ settings: LOCKED });

      const result = await save(repository, { input: departureInput(policy, { mtow: 0 }) });

      expect(result).toEqual({
        ok: false, code: 'invalid-argument', validationErrors: [{ field: 'mtow', reason: 'must-be-positive' }],
      });
    });

    it('prefers a permission denial over validation errors', async () => {
      const repository = repositoryWith({ existing: stored('departure', policy, { createdBy: ACTORS.otherPilot.email }) });

      const result = await save(repository, { key: 'k1', input: { mtow: 0 } });

      expect(result).toEqual({ ok: false, code: 'permission-denied', reason: 'not-owner' });
    });

    it('reports the lock for a valid write', async () => {
      const repository = repositoryWith({ settings: LOCKED });

      expect(await save(repository, { input: departureInput(policy) })).toEqual({
        ok: false, code: 'failed-precondition', reason: 'movement-locked',
      });
      expect(repository.createMovement).not.toHaveBeenCalled();
    });

    it('rejects what the app would not record: no runway, a flight type of another category', async () => {
      const repository = repositoryWith();

      const result = await save(repository, { input: departureInput(policy, { runway: undefined, flightType: 'glider_private_winch' }) });

      expect(result).toEqual({
        ok: false,
        code: 'invalid-argument',
        validationErrors: [
          { field: 'runway', reason: 'required' },
          { field: 'flightType', reason: 'not-for-aircraft-category' },
        ],
      });
      expect(repository.createMovement).not.toHaveBeenCalled();
    });

    it('records a helicopter without a runway where the aerodrome says so (lsze)', async () => {
      const repository = repositoryWith();

      const input = departureInput(policy, { runway: undefined, aircraftCategory: 'Hubschrauber', flightType: 'private' });
      expect(await save(repository, { input })).toEqual({ ok: true, key: '-Nnew', created: true });
    });

    it('does not ask a stored movement without a runway for one when other fields change', async () => {
      const repository = repositoryWith({
        existing: stored('departure', policy, { createdBy: ACTORS.pilot.email, runway: undefined }),
      });

      expect(await save(repository, { key: 'k1', input: { remarks: 'x' } })).toEqual({ ok: true, key: 'k1', created: false });
    });

    it('passes write failures on', async () => {
      const repository = repositoryWith();
      const failure = new Error('rules');
      repository.createMovement.mockRejectedValue(failure);

      await expect(save(repository, { input: departureInput(policy) })).rejects.toBe(failure);
    });
  });
});
