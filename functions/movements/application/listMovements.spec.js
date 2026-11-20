'use strict';

const { listMovements } = require('./listMovements');
const { loadVariant } = require('../domain/testing/projectPolicies');
const { ACTORS } = require('../domain/testing/movementCases');

const at = iso => ({ dateTime: iso, negativeTimestamp: -Date.parse(iso) });
const FROM = Date.parse('2026-11-20T00:00:00.000Z');
const TO = Date.parse('2026-11-20T23:59:59.999Z');

function repositoryWith({ all = false, departures = [], arrivals = [] } = {}) {
  const lists = { departure: departures, arrival: arrivals };
  return {
    resolveReader: jest.fn(async () => ({ all, authOverride: { uid: 'reader' } })),
    listMovements: jest.fn(async (type, query) => lists[type].slice(0, query.limit)),
  };
}

describe('functions', () => {
  describe('movements/application/listMovements', () => {
    const { policy } = loadVariant('lsze');
    const list = (repository, props = {}) =>
      listMovements({ repository, policy, actor: ACTORS.pilot, fromMs: FROM, toMs: TO, ...props });

    it('lists a pilot\'s own movements of both types, sorted by time', async () => {
      const repository = repositoryWith({
        departures: [['d1', { ...at('2026-11-20T14:30:00.000Z'), createdBy: 'pilot@example.com', firstname: 'Hans' }]],
        arrivals: [['a1', { ...at('2026-11-20T09:15:00.000Z'), createdBy: 'pilot@example.com', firstname: 'Hans' }]],
      });

      const result = await list(repository);

      expect(result.truncated).toBe(false);
      expect(result.movements.map(m => [m.type, m.key, m.own, m.firstname])).toEqual([
        ['arrival', 'a1', true, 'Hans'],
        ['departure', 'd1', true, 'Hans'],
      ]);
      expect(repository.listMovements).toHaveBeenCalledWith(
        'departure', { fromMs: FROM, toMs: TO, owner: 'pilot@example.com', limit: 201 }, { uid: 'reader' });
    });

    it('asks for all movements for a reader who may see them, others without personal data', async () => {
      const repository = repositoryWith({
        all: true,
        arrivals: [
          ['a1', { ...at('2026-11-20T09:15:00.000Z'), createdBy: 'other@example.com', firstname: 'Erika', immatriculation: 'HBKOF' }],
          ['a2', { ...at('2026-11-20T10:00:00.000Z'), createdBy: 'pilot@example.com', firstname: 'Hans' }],
        ],
      });

      const { movements } = await list(repository, { types: ['arrival'] });

      expect(repository.listMovements).toHaveBeenCalledWith(
        'arrival', expect.objectContaining({ owner: null }), { uid: 'reader' });
      expect(movements).toEqual([
        { type: 'arrival', key: 'a1', own: false, dateTime: '2026-11-20T09:15:00.000Z', immatriculation: 'HBKOF' },
        expect.objectContaining({ key: 'a2', own: true, firstname: 'Hans' }),
      ]);
    });

    it('drops what the query should not have returned (defence in depth)', async () => {
      const repository = repositoryWith({
        departures: [
          ['d1', { ...at('2026-11-21T08:00:00.000Z'), createdBy: 'pilot@example.com' }], // outside the period
          ['d2', { ...at('2026-11-20T08:00:00.000Z'), createdBy: 'other@example.com' }], // not own
          ['d3', { dateTime: 'x', createdBy: 'pilot@example.com' }], // no timestamp
        ],
      });

      expect((await list(repository, { types: ['departure'] })).movements).toEqual([]);
    });

    it('reports truncation past the limit', async () => {
      const departures = [0, 1, 2].map(i => [`d${i}`, { ...at(`2026-11-20T1${i}:00:00.000Z`), createdBy: 'pilot@example.com' }]);
      const result = await list(repositoryWith({ departures }), { types: ['departure'], limit: 2 });

      expect(result.truncated).toBe(true);
      expect(result.movements).toHaveLength(2);
    });

    it('gives a caller without e-mail and without the right to see all nothing', async () => {
      const repository = repositoryWith();

      expect(await list(repository, { actor: ACTORS.guest })).toEqual({ movements: [], truncated: false });
      expect(repository.listMovements).not.toHaveBeenCalled();
    });
  });
});
