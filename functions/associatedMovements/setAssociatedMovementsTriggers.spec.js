'use strict';

const mockCapturedHandlers = {};

jest.mock('firebase-functions', () => {
  const makeDbRef = (path) => ({
    onCreate: jest.fn(handler => {
      mockCapturedHandlers[`onCreate:${path}`] = handler;
    }),
    onWrite: jest.fn(handler => {
      mockCapturedHandlers[`onWrite:${path}`] = handler;
    }),
    onDelete: jest.fn(handler => {
      mockCapturedHandlers[`onDelete:${path}`] = handler;
    })
  });

  const mock = {
    config: jest.fn(() => ({ rtdb: { instance: 'test-instance' } })),
    logger: {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      log: jest.fn()
    },
    database: {
      instance: jest.fn(() => ({
        ref: makeDbRef
      }))
    }
  };
  mock.region = jest.fn(() => mock);
  return mock;
});

const mockUpdate = jest.fn();
const mockOnce = jest.fn();
const mockRef = jest.fn();

jest.mock('firebase-admin', () => ({
  database: jest.fn(() => ({ ref: mockRef }))
}));

jest.mock('./utils', () => ({
  path: jest.fn(type => type === 'departure' ? '/movementAssociations/departures' : '/movementAssociations/arrivals'),
  loadAircraftMovements: jest.fn(),
  isHomeBase: jest.fn(),
  getAssociatedMovement: jest.fn(),
  setAssociatedMovement: jest.fn()
}));

const utils = require('./utils');

require('./setAssociatedMovementsTriggers');

describe('functions/associatedMovements/setAssociatedMovementsTriggers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const buildDbRef = (movementData) => {
    mockRef.mockImplementation(() => ({
      child: jest.fn(() => ({
        update: mockUpdate.mockResolvedValue(),
        remove: jest.fn().mockResolvedValue(),
        once: mockOnce.mockResolvedValue({
          exists: () => !!movementData,
          val: () => movementData
        })
      }))
    }));
  };

  describe('isRelevantUpdate', () => {
    // Tested implicitly via updateOnWrite handler

    it('triggers update when dateTime changes', async () => {
      buildDbRef({ immatriculation: 'HBKOF', type: 'departure', key: 'dep-001' });

      utils.loadAircraftMovements.mockResolvedValue([]);
      utils.isHomeBase.mockResolvedValue(true);
      utils.getAssociatedMovement.mockReturnValue(null);
      utils.setAssociatedMovement.mockResolvedValue();

      const change = {
        before: { val: () => ({ dateTime: '2024-01-01T10:00:00', immatriculation: 'HBKOF' }) },
        after: {
          val: () => ({ dateTime: '2024-01-01T11:00:00', immatriculation: 'HBKOF' }),
          ref: { key: 'dep-001' }
        }
      };

      const handler = mockCapturedHandlers['onWrite:/departures/{departureId}'];
      await handler(change);

      expect(utils.setAssociatedMovement).toHaveBeenCalled();
    });

    it('triggers update when departureRoute changes', async () => {
      buildDbRef({ immatriculation: 'HBKOF', type: 'departure', key: 'dep-001' });

      utils.loadAircraftMovements.mockResolvedValue([]);
      utils.isHomeBase.mockResolvedValue(true);
      utils.getAssociatedMovement.mockReturnValue(null);
      utils.setAssociatedMovement.mockResolvedValue();

      const change = {
        before: { val: () => ({ dateTime: '2024-01-01T10:00:00', departureRoute: 'north', immatriculation: 'HBKOF' }) },
        after: {
          val: () => ({ dateTime: '2024-01-01T10:00:00', departureRoute: 'south', immatriculation: 'HBKOF' }),
          ref: { key: 'dep-001' }
        }
      };

      const handler = mockCapturedHandlers['onWrite:/departures/{departureId}'];
      await handler(change);

      expect(utils.setAssociatedMovement).toHaveBeenCalled();
    });

    it('triggers update when arrivalRoute changes', async () => {
      buildDbRef({ immatriculation: 'HBKOF', type: 'arrival', key: 'arr-001' });

      utils.loadAircraftMovements.mockResolvedValue([]);
      utils.isHomeBase.mockResolvedValue(true);
      utils.getAssociatedMovement.mockReturnValue(null);
      utils.setAssociatedMovement.mockResolvedValue();

      const change = {
        before: { val: () => ({ dateTime: '2024-01-01T10:00:00', arrivalRoute: 'north', immatriculation: 'HBKOF' }) },
        after: {
          val: () => ({ dateTime: '2024-01-01T10:00:00', arrivalRoute: 'circuits', immatriculation: 'HBKOF' }),
          ref: { key: 'arr-001' }
        }
      };

      const handler = mockCapturedHandlers['onWrite:/arrivals/{arrivalId}'];
      await handler(change);

      expect(utils.setAssociatedMovement).toHaveBeenCalled();
    });

    it('triggers update when immatriculation changes', async () => {
      buildDbRef({ immatriculation: 'HBABC', type: 'departure', key: 'dep-001' });

      utils.loadAircraftMovements.mockResolvedValue([]);
      utils.isHomeBase.mockResolvedValue(true);
      utils.getAssociatedMovement.mockReturnValue(null);
      utils.setAssociatedMovement.mockResolvedValue();

      const change = {
        before: { val: () => ({ dateTime: '2024-01-01T10:00:00', immatriculation: 'HBKOF' }) },
        after: {
          val: () => ({ dateTime: '2024-01-01T10:00:00', immatriculation: 'HBABC' }),
          ref: { key: 'dep-001' }
        }
      };

      const handler = mockCapturedHandlers['onWrite:/departures/{departureId}'];
      await handler(change);

      expect(utils.setAssociatedMovement).toHaveBeenCalled();
    });

    it('does NOT trigger update when no relevant fields change', async () => {
      const change = {
        before: {
          val: () => ({
            dateTime: '2024-01-01T10:00:00',
            departureRoute: 'north',
            arrivalRoute: null,
            immatriculation: 'HBKOF',
            otherField: 'old'
          })
        },
        after: {
          val: () => ({
            dateTime: '2024-01-01T10:00:00',
            departureRoute: 'north',
            arrivalRoute: null,
            immatriculation: 'HBKOF',
            otherField: 'new' // changed but not relevant
          }),
          ref: { key: 'dep-001' }
        }
      };

      const handler = mockCapturedHandlers['onWrite:/departures/{departureId}'];
      await handler(change);

      expect(utils.setAssociatedMovement).not.toHaveBeenCalled();
    });
  });

  describe('onWrite guard', () => {
    it('returns early for create events (before=null) without processing', async () => {
      const change = {
        before: { val: () => null },
        after: {
          val: () => ({ dateTime: '2024-01-01T10:00:00', immatriculation: 'HBKOF' }),
          ref: { key: 'dep-001' }
        }
      };

      const handler = mockCapturedHandlers['onWrite:/departures/{departureId}'];
      await handler(change);

      expect(utils.setAssociatedMovement).not.toHaveBeenCalled();
    });

    it('returns early for delete events (after=null) without processing', async () => {
      const change = {
        before: { val: () => ({ dateTime: '2024-01-01T10:00:00', immatriculation: 'HBKOF' }) },
        after: { val: () => null, ref: { key: 'dep-001' } }
      };

      const handler = mockCapturedHandlers['onWrite:/departures/{departureId}'];
      await handler(change);

      expect(utils.setAssociatedMovement).not.toHaveBeenCalled();
    });
  });

  describe('updateOnCreate', () => {
    it('sets associated movement for new departure', async () => {
      buildDbRef(null);

      utils.loadAircraftMovements.mockResolvedValue([]);
      utils.isHomeBase.mockResolvedValue(true);
      utils.getAssociatedMovement.mockReturnValue(null);
      utils.setAssociatedMovement.mockResolvedValue();

      const snap = {
        ref: { key: 'dep-001' },
        val: () => ({ immatriculation: 'HBKOF', dateTime: '2024-01-01T10:00:00' })
      };

      const handler = mockCapturedHandlers['onCreate:/departures/{departureId}'];
      await handler(snap);

      expect(utils.loadAircraftMovements).toHaveBeenCalledWith('HBKOF');
      expect(utils.setAssociatedMovement).toHaveBeenCalledWith('dep-001', 'departure', null);
    });

    it('sets associated movement for new arrival', async () => {
      buildDbRef(null);

      const associatedDep = { key: 'dep-001', type: 'departure' };
      utils.loadAircraftMovements.mockResolvedValue([associatedDep]);
      utils.isHomeBase.mockResolvedValue(false);
      utils.getAssociatedMovement.mockReturnValue(associatedDep);
      utils.setAssociatedMovement.mockResolvedValue();

      const snap = {
        ref: { key: 'arr-001' },
        val: () => ({ immatriculation: 'HBABC', dateTime: '2024-01-01T11:00:00' })
      };

      const handler = mockCapturedHandlers['onCreate:/arrivals/{arrivalId}'];
      await handler(snap);

      expect(utils.loadAircraftMovements).toHaveBeenCalledWith('HBABC');
      expect(utils.setAssociatedMovement).toHaveBeenCalledWith('arr-001', 'arrival', associatedDep);
    });

    it('sets back-link for associated movement when found', async () => {
      buildDbRef(null);

      const associatedDep = { key: 'dep-001', type: 'departure' };
      utils.loadAircraftMovements.mockResolvedValue([associatedDep]);
      utils.isHomeBase.mockResolvedValue(true);
      utils.getAssociatedMovement.mockReturnValue(associatedDep);
      utils.setAssociatedMovement.mockResolvedValue();

      const snap = {
        ref: { key: 'arr-001' },
        val: () => ({ immatriculation: 'HBKOF', dateTime: '2024-01-01T11:00:00' })
      };

      const handler = mockCapturedHandlers['onCreate:/arrivals/{arrivalId}'];
      await handler(snap);

      expect(utils.setAssociatedMovement).toHaveBeenCalledWith('arr-001', 'arrival', associatedDep);
      expect(utils.setAssociatedMovement).toHaveBeenCalledWith('dep-001', 'departure', { key: 'arr-001', type: 'arrival' });
    });
  });

  describe('updateOnDelete', () => {
    it('does nothing when no association record in DB for deleted movement', async () => {
      buildDbRef(null);

      const snap = {
        ref: { key: 'dep-001' },
        val: () => ({ immatriculation: 'HBKOF' })
      };

      const handler = mockCapturedHandlers['onDelete:/departures/{departureId}'];
      await handler(snap);

      expect(utils.setAssociatedMovement).not.toHaveBeenCalled();
    });

    it('does nothing when DB association record has invalid type', async () => {
      buildDbRef({ type: 'none' });

      const snap = {
        ref: { key: 'dep-001' },
        val: () => ({ immatriculation: 'HBKOF' })
      };

      const handler = mockCapturedHandlers['onDelete:/departures/{departureId}'];
      await handler(snap);

      expect(utils.setAssociatedMovement).not.toHaveBeenCalled();
    });

    it('always removes own association record when association type is none', async () => {
      const mockRemove = jest.fn().mockResolvedValue();

      mockRef.mockImplementation(() => ({
        child: jest.fn(() => ({
          update: mockUpdate.mockResolvedValue(),
          remove: mockRemove,
          once: mockOnce.mockResolvedValue({
            exists: () => true,
            val: () => ({ type: 'none' })
          })
        }))
      }));

      const snap = {
        ref: { key: 'dep-001' },
        val: () => ({ immatriculation: 'HBKOF' })
      };

      const handler = mockCapturedHandlers['onDelete:/departures/{departureId}'];
      await handler(snap);

      expect(mockRemove).toHaveBeenCalled();
      expect(utils.setAssociatedMovement).not.toHaveBeenCalled();
    });

    it('always removes own association record when no association exists in DB', async () => {
      const mockRemove = jest.fn().mockResolvedValue();

      mockRef.mockImplementation(() => ({
        child: jest.fn(() => ({
          update: mockUpdate.mockResolvedValue(),
          remove: mockRemove,
          once: mockOnce.mockResolvedValue({
            exists: () => false,
            val: () => null
          })
        }))
      }));

      const snap = {
        ref: { key: 'dep-001' },
        val: () => ({ immatriculation: 'HBKOF' })
      };

      const handler = mockCapturedHandlers['onDelete:/departures/{departureId}'];
      await handler(snap);

      expect(mockRemove).toHaveBeenCalled();
      expect(utils.setAssociatedMovement).not.toHaveBeenCalled();
    });

    it('resets associated movement when departure has valid association in DB', async () => {
      const associatedMovementData = {
        key: 'arr-001',
        type: 'arrival',
        immatriculation: 'HBKOF',
        dateTime: '2024-01-01T12:00:00'
      };

      mockRef.mockImplementation(() => ({
        child: jest.fn(() => ({
          update: mockUpdate.mockResolvedValue(),
          remove: jest.fn().mockResolvedValue(),
          once: mockOnce.mockResolvedValue({
            exists: () => true,
            val: () => associatedMovementData
          })
        }))
      }));

      utils.loadAircraftMovements.mockResolvedValue([]);
      utils.isHomeBase.mockResolvedValue(true);
      utils.getAssociatedMovement.mockReturnValue(null);
      utils.setAssociatedMovement.mockResolvedValue();

      const snap = {
        ref: { key: 'dep-001' },
        val: () => ({ immatriculation: 'HBKOF' })
      };

      const handler = mockCapturedHandlers['onDelete:/departures/{departureId}'];
      await handler(snap);

      expect(utils.setAssociatedMovement).toHaveBeenCalled();
    });

    it('handles deleted arrival with associated departure in DB', async () => {
      const associatedMovementData = {
        key: 'dep-001',
        type: 'departure',
        immatriculation: 'HBABC',
        dateTime: '2024-01-01T10:00:00'
      };

      mockRef.mockImplementation(() => ({
        child: jest.fn(() => ({
          update: mockUpdate.mockResolvedValue(),
          remove: jest.fn().mockResolvedValue(),
          once: mockOnce.mockResolvedValue({
            exists: () => true,
            val: () => associatedMovementData
          })
        }))
      }));

      utils.loadAircraftMovements.mockResolvedValue([]);
      utils.isHomeBase.mockResolvedValue(false);
      utils.getAssociatedMovement.mockReturnValue(null);
      utils.setAssociatedMovement.mockResolvedValue();

      const snap = {
        ref: { key: 'arr-001' },
        val: () => ({ immatriculation: 'HBABC' })
      };

      const handler = mockCapturedHandlers['onDelete:/arrivals/{arrivalId}'];
      await handler(snap);

      expect(utils.setAssociatedMovement).toHaveBeenCalled();
    });
  });

  describe('updateOnDelete: reads association from DB', () => {
    it('re-evaluates surviving arrival when homebase departure deleted', async () => {
      const assocRecord = { key: 'arr-001', type: 'arrival' };
      const fullArrival = {
        immatriculation: 'HBKOF',
        dateTime: '2024-01-01T12:00:00'
      };

      let onceCalls = 0;
      mockRef.mockImplementation(() => ({
        child: jest.fn(() => ({
          update: mockUpdate.mockResolvedValue(),
          remove: jest.fn().mockResolvedValue(),
          once: jest.fn().mockImplementation(() => {
            onceCalls++;
            if (onceCalls === 1) {
              // assoc record from /movementAssociations/departures/dep-001
              return Promise.resolve({ exists: () => true, val: () => assocRecord });
            }
            if (onceCalls === 2) {
              // full movement from /arrivals/arr-001
              return Promise.resolve({ exists: () => true, val: () => fullArrival });
            }
            return Promise.resolve({ exists: () => false, val: () => null });
          })
        }))
      }));

      utils.loadAircraftMovements.mockResolvedValue([]);
      utils.isHomeBase.mockResolvedValue(true);
      utils.getAssociatedMovement.mockReturnValue(null);
      utils.setAssociatedMovement.mockResolvedValue();

      const snap = {
        ref: { key: 'dep-001' },
        val: () => ({ immatriculation: 'HBKOF', dateTime: '2024-01-01T10:00:00' })
      };

      const handler = mockCapturedHandlers['onDelete:/departures/{departureId}'];
      await handler(snap);

      expect(utils.loadAircraftMovements).toHaveBeenCalledWith('HBKOF');
      expect(utils.setAssociatedMovement).toHaveBeenCalledWith('arr-001', 'arrival', null);
    });

    it('re-evaluates surviving departure when external arrival deleted', async () => {
      const assocRecord = { key: 'dep-001', type: 'departure' };
      const fullDeparture = {
        immatriculation: 'DEXYZ',
        dateTime: '2024-01-01T14:00:00'
      };

      let onceCalls = 0;
      mockRef.mockImplementation(() => ({
        child: jest.fn(() => ({
          update: mockUpdate.mockResolvedValue(),
          remove: jest.fn().mockResolvedValue(),
          once: jest.fn().mockImplementation(() => {
            onceCalls++;
            if (onceCalls === 1) {
              // assoc record from /movementAssociations/arrivals/arr-001
              return Promise.resolve({ exists: () => true, val: () => assocRecord });
            }
            if (onceCalls === 2) {
              // full movement from /departures/dep-001
              return Promise.resolve({ exists: () => true, val: () => fullDeparture });
            }
            return Promise.resolve({ exists: () => false, val: () => null });
          })
        }))
      }));

      utils.loadAircraftMovements.mockResolvedValue([]);
      utils.isHomeBase.mockResolvedValue(false);
      utils.getAssociatedMovement.mockReturnValue(null);
      utils.setAssociatedMovement.mockResolvedValue();

      const snap = {
        ref: { key: 'arr-001' },
        val: () => ({ immatriculation: 'DEXYZ', dateTime: '2024-01-01T12:00:00' })
      };

      const handler = mockCapturedHandlers['onDelete:/arrivals/{arrivalId}'];
      await handler(snap);

      expect(utils.loadAircraftMovements).toHaveBeenCalledWith('DEXYZ');
      expect(utils.setAssociatedMovement).toHaveBeenCalledWith('dep-001', 'departure', null);
    });
  });

  describe('updateAssociatedMovement: already-updated guard', () => {
    it('skips update for movement already processed in this run', async () => {
      buildDbRef(null);

      let callCount = 0;
      utils.loadAircraftMovements.mockResolvedValue([]);
      utils.isHomeBase.mockResolvedValue(true);
      utils.getAssociatedMovement.mockReturnValue(null);
      utils.setAssociatedMovement.mockImplementation(() => {
        callCount++;
        return Promise.resolve();
      });

      const snap = {
        ref: { key: 'dep-001' },
        val: () => ({ immatriculation: 'HBKOF', dateTime: '2024-01-01T10:00:00' })
      };

      const handler = mockCapturedHandlers['onCreate:/departures/{departureId}'];
      await handler(snap);

      expect(callCount).toBe(1);
    });
  });

  describe('cascade update: old associated movement gets re-evaluated', () => {
    it('re-evaluates old associated movement of the updated movement', async () => {
      const oldAssocRecord = { key: 'arr-old', type: 'arrival' };

      // call 1: dep-001's old assoc from DB; call 2+: loadMovement for arr-old (not found)
      let onceCalls = 0;
      mockRef.mockImplementation(() => ({
        child: jest.fn(() => ({
          update: mockUpdate.mockResolvedValue(),
          remove: jest.fn().mockResolvedValue(),
          once: jest.fn().mockImplementation(() => {
            onceCalls++;
            if (onceCalls === 1) {
              return Promise.resolve({
                exists: () => true,
                val: () => oldAssocRecord
              });
            }
            return Promise.resolve({ exists: () => false, val: () => null });
          })
        }))
      }));

      utils.loadAircraftMovements.mockResolvedValue([]);
      utils.isHomeBase.mockResolvedValue(true);
      utils.getAssociatedMovement.mockReturnValue(null);
      utils.setAssociatedMovement.mockResolvedValue();

      const snap = {
        ref: { key: 'dep-001' },
        val: () => ({
          immatriculation: 'HBKOF',
          dateTime: '2024-01-01T10:00:00'
        })
      };

      const handler = mockCapturedHandlers['onCreate:/departures/{departureId}'];
      await handler(snap);

      expect(onceCalls).toBeGreaterThanOrEqual(2);
      expect(utils.setAssociatedMovement).toHaveBeenCalledWith('dep-001', 'departure', null);
    });

    it('re-evaluates old associated movement of the associated movement', async () => {
      const newAssociatedMovement = {
        key: 'arr-001',
        type: 'arrival'
      };

      const oldAssocOfAssoc = { key: 'dep-prev', type: 'departure' };
      const depPrevData = {
        key: 'dep-prev',
        type: 'departure',
        immatriculation: 'HBKOF',
        dateTime: '2024-01-01T08:00:00'
      };

      let onceCalls = 0;
      mockRef.mockImplementation(() => ({
        child: jest.fn(() => ({
          update: mockUpdate.mockResolvedValue(),
          remove: jest.fn().mockResolvedValue(),
          once: jest.fn().mockImplementation(() => {
            onceCalls++;
            if (onceCalls === 1) {
              // dep-001's old assoc from DB — null (no previous assoc)
              return Promise.resolve({ exists: () => false, val: () => null });
            }
            if (onceCalls === 2) {
              // arr-001's old assoc from DB — dep-prev
              return Promise.resolve({ exists: () => true, val: () => oldAssocOfAssoc });
            }
            if (onceCalls === 3) {
              // loadMovement for dep-prev
              return Promise.resolve({ exists: () => true, val: () => depPrevData });
            }
            return Promise.resolve({ exists: () => false, val: () => null });
          })
        }))
      }));

      utils.loadAircraftMovements.mockResolvedValue([]);
      utils.isHomeBase.mockResolvedValue(true);
      utils.getAssociatedMovement.mockReturnValue(newAssociatedMovement);
      utils.setAssociatedMovement.mockResolvedValue();

      const snap = {
        ref: { key: 'dep-001' },
        val: () => ({
          immatriculation: 'HBKOF',
          dateTime: '2024-01-01T10:00:00'
        })
      };

      const handler = mockCapturedHandlers['onCreate:/departures/{departureId}'];
      await handler(snap);

      expect(utils.setAssociatedMovement).toHaveBeenCalledWith('dep-001', 'departure', newAssociatedMovement);
      expect(utils.setAssociatedMovement).toHaveBeenCalledWith('arr-001', 'arrival', { key: 'dep-001', type: 'departure' });
    });

    it('skips updateAssociatedMovement for already-updated movement via cascade', async () => {
      const arrMovement = {
        key: 'arr-001',
        type: 'arrival',
        immatriculation: 'HBKOF',
        dateTime: '2024-01-01T11:00:00'
      };

      mockRef.mockImplementation(() => ({
        child: jest.fn(() => ({
          update: mockUpdate.mockResolvedValue(),
          remove: jest.fn().mockResolvedValue(),
          once: jest.fn().mockResolvedValue({
            exists: () => true,
            val: () => arrMovement
          })
        }))
      }));

      utils.loadAircraftMovements.mockResolvedValue([arrMovement]);
      utils.isHomeBase.mockResolvedValue(true);
      utils.getAssociatedMovement.mockReturnValue(arrMovement);
      utils.setAssociatedMovement.mockResolvedValue();

      const snap = {
        ref: { key: 'dep-001' },
        val: () => ({
          immatriculation: 'HBKOF',
          dateTime: '2024-01-01T10:00:00'
        })
      };

      const handler = mockCapturedHandlers['onCreate:/departures/{departureId}'];
      await handler(snap);

      expect(utils.setAssociatedMovement).toHaveBeenCalledWith('dep-001', 'departure', arrMovement);
      expect(utils.setAssociatedMovement).toHaveBeenCalledWith('arr-001', 'arrival', { key: 'dep-001', type: 'departure' });
    });

    it('loadAndUpdateAssociatedMovement skips when loadMovement returns null', async () => {
      const oldAssocRecord = { key: 'arr-deleted', type: 'arrival' };

      let onceCalls = 0;
      mockRef.mockImplementation(() => ({
        child: jest.fn(() => ({
          update: mockUpdate.mockResolvedValue(),
          remove: jest.fn().mockResolvedValue(),
          once: jest.fn().mockImplementation(() => {
            onceCalls++;
            if (onceCalls === 1) {
              // dep-001's old assoc — valid
              return Promise.resolve({ exists: () => true, val: () => oldAssocRecord });
            }
            // loadMovement for arr-deleted — not found
            return Promise.resolve({ exists: () => false, val: () => null });
          })
        }))
      }));

      utils.loadAircraftMovements.mockResolvedValue([]);
      utils.isHomeBase.mockResolvedValue(true);
      utils.getAssociatedMovement.mockReturnValue(null);
      utils.setAssociatedMovement.mockResolvedValue();

      const snap = {
        ref: { key: 'dep-001' },
        val: () => ({
          immatriculation: 'HBKOF',
          dateTime: '2024-01-01T10:00:00'
        })
      };

      const handler = mockCapturedHandlers['onCreate:/departures/{departureId}'];
      await handler(snap);

      expect(utils.setAssociatedMovement).toHaveBeenCalledWith('dep-001', 'departure', null);
      expect(utils.setAssociatedMovement).toHaveBeenCalledTimes(1);
    });
  });

  describe('cascade reads old association from DB', () => {
    it('cascade fires when old association is in DB but movement object has no associatedMovement field', async () => {
      const oldAssocRecord = { key: 'arr-old', type: 'arrival' };

      let onceCalls = 0;
      mockRef.mockImplementation(() => ({
        child: jest.fn(() => ({
          update: mockUpdate.mockResolvedValue(),
          remove: jest.fn().mockResolvedValue(),
          once: jest.fn().mockImplementation(() => {
            onceCalls++;
            if (onceCalls === 1) {
              // dep-001's old assoc from /movementAssociations/departures/dep-001
              return Promise.resolve({ exists: () => true, val: () => oldAssocRecord });
            }
            // loadMovement for arr-old: not in DB
            return Promise.resolve({ exists: () => false, val: () => null });
          })
        }))
      }));

      utils.loadAircraftMovements.mockResolvedValue([]);
      utils.isHomeBase.mockResolvedValue(true);
      utils.getAssociatedMovement.mockReturnValue(null);
      utils.setAssociatedMovement.mockResolvedValue();

      const snap = {
        ref: { key: 'dep-001' },
        val: () => ({ immatriculation: 'HBKOF', dateTime: '2024-01-01T10:00:00' })
      };

      const handler = mockCapturedHandlers['onCreate:/departures/{departureId}'];
      await handler(snap);

      expect(onceCalls).toBeGreaterThanOrEqual(2);
      expect(utils.setAssociatedMovement).toHaveBeenCalledWith('dep-001', 'departure', null);
    });
  });

  describe('loadMovement reads from movement collection', () => {
    it('uses /arrivals path, not /movementAssociations/arrivals', async () => {
      const assocRecord = { key: 'arr-001', type: 'arrival' };
      const fullArrival = { immatriculation: 'HBKOF', dateTime: '2024-01-01T12:00:00' };

      let onceCalls = 0;
      mockRef.mockImplementation(path => ({
        child: jest.fn(() => ({
          update: mockUpdate.mockResolvedValue(),
          remove: jest.fn().mockResolvedValue(),
          once: jest.fn().mockImplementation(() => {
            onceCalls++;
            if (onceCalls === 1) {
              return Promise.resolve({ exists: () => true, val: () => assocRecord });
            }
            if (onceCalls === 2) {
              return Promise.resolve({ exists: () => true, val: () => fullArrival });
            }
            return Promise.resolve({ exists: () => false, val: () => null });
          })
        }))
      }));

      utils.loadAircraftMovements.mockResolvedValue([]);
      utils.isHomeBase.mockResolvedValue(true);
      utils.getAssociatedMovement.mockReturnValue(null);
      utils.setAssociatedMovement.mockResolvedValue();

      const snap = {
        ref: { key: 'dep-001' },
        val: () => ({ immatriculation: 'HBKOF', dateTime: '2024-01-01T10:00:00' })
      };

      const handler = mockCapturedHandlers['onDelete:/departures/{departureId}'];
      await handler(snap);

      expect(utils.loadAircraftMovements).toHaveBeenCalledWith('HBKOF');
      expect(utils.loadAircraftMovements).not.toHaveBeenCalledWith(undefined);

      const refPaths = mockRef.mock.calls.map(call => call[0]);
      expect(refPaths).toContain('/arrivals');
    });
  });
});
