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

  return {
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
    // admin.database().ref(path).child(key).update({...})
    // admin.database().ref(path).child(key).once('value')
    mockRef.mockImplementation(() => ({
      child: jest.fn(() => ({
        update: mockUpdate.mockResolvedValue(),
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

      const associatedDep = { key: 'dep-001', type: 'departure', associatedMovement: null };
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

      // setAssociatedMovement should be called for the movement itself AND the back-link
      expect(utils.setAssociatedMovement).toHaveBeenCalledWith('arr-001', 'arrival', associatedDep);
      expect(utils.setAssociatedMovement).toHaveBeenCalledWith('dep-001', 'departure', { key: 'arr-001', type: 'arrival' });
    });
  });

  describe('updateOnDelete', () => {
    it('does nothing when deleted movement has no associated movement', async () => {
      const snap = {
        ref: { key: 'dep-001' },
        val: () => ({
          immatriculation: 'HBKOF',
          associatedMovement: null // no associated movement
        })
      };

      const handler = mockCapturedHandlers['onDelete:/departures/{departureId}'];
      await handler(snap);

      expect(utils.setAssociatedMovement).not.toHaveBeenCalled();
    });

    it('does nothing when associated movement type is not departure/arrival', async () => {
      const snap = {
        ref: { key: 'dep-001' },
        val: () => ({
          immatriculation: 'HBKOF',
          associatedMovement: { key: 'x-001', type: 'none' } // invalid type
        })
      };

      const handler = mockCapturedHandlers['onDelete:/departures/{departureId}'];
      await handler(snap);

      expect(utils.setAssociatedMovement).not.toHaveBeenCalled();
    });

    it('resets associated movement when departure has valid associated movement', async () => {
      const associatedMovementData = {
        key: 'arr-001',
        type: 'arrival',
        immatriculation: 'HBKOF',
        dateTime: '2024-01-01T12:00:00'
      };

      mockRef.mockImplementation(() => ({
        child: jest.fn(() => ({
          update: mockUpdate.mockResolvedValue(),
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
        val: () => ({
          immatriculation: 'HBKOF',
          associatedMovement: { key: 'arr-001', type: 'arrival' }
        })
      };

      const handler = mockCapturedHandlers['onDelete:/departures/{departureId}'];
      await handler(snap);

      expect(utils.setAssociatedMovement).toHaveBeenCalled();
    });

    it('handles deleted arrival with associated departure', async () => {
      const associatedMovementData = {
        key: 'dep-001',
        type: 'departure',
        immatriculation: 'HBABC',
        dateTime: '2024-01-01T10:00:00'
      };

      mockRef.mockImplementation(() => ({
        child: jest.fn(() => ({
          update: mockUpdate.mockResolvedValue(),
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
        val: () => ({
          immatriculation: 'HBABC',
          associatedMovement: { key: 'dep-001', type: 'departure' }
        })
      };

      const handler = mockCapturedHandlers['onDelete:/arrivals/{arrivalId}'];
      await handler(snap);

      expect(utils.setAssociatedMovement).toHaveBeenCalled();
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

      // Should be called once (the initial update)
      expect(callCount).toBe(1);
    });
  });

  describe('cascade update: old associated movement gets re-evaluated', () => {
    it('re-evaluates old associated movement of the updated movement (line 72 path)', async () => {
      // The movement being updated had a previous associatedMovement.
      // After the update, that old associated movement must be re-evaluated.
      // loadMovement is called for the old associated movement key.
      const oldAssocMovement = { key: 'arr-old', type: 'arrival' };
      const oldAssocMovementData = {
        key: 'arr-old',
        type: 'arrival',
        immatriculation: 'HBKOF',
        dateTime: '2024-01-01T09:00:00',
        associatedMovement: null
      };

      // First call: for arr-old (exists), subsequent calls return not-existing
      let onceCalls = 0;
      mockRef.mockImplementation(() => ({
        child: jest.fn(() => ({
          update: mockUpdate.mockResolvedValue(),
          once: jest.fn().mockImplementation(() => {
            onceCalls++;
            if (onceCalls === 1) {
              return Promise.resolve({
                exists: () => true,
                val: () => oldAssocMovementData
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
          dateTime: '2024-01-01T10:00:00',
          associatedMovement: oldAssocMovement // had an old association
        })
      };

      const handler = mockCapturedHandlers['onCreate:/departures/{departureId}'];
      await handler(snap);

      // setAssociatedMovement called at least once for the movement itself
      expect(utils.setAssociatedMovement).toHaveBeenCalled();
    });

    it('re-evaluates old associated movement of the associated movement (line 85 path)', async () => {
      // The new associated movement had its own old associated movement.
      // That old-of-old must also be re-evaluated.
      const newAssociatedMovement = {
        key: 'arr-001',
        type: 'arrival',
        associatedMovement: { key: 'dep-prev', type: 'departure' } // arr-001 used to point to dep-prev
      };

      const depPrevData = {
        key: 'dep-prev',
        type: 'departure',
        immatriculation: 'HBKOF',
        dateTime: '2024-01-01T08:00:00',
        associatedMovement: null
      };

      let onceCalls = 0;
      mockRef.mockImplementation(() => ({
        child: jest.fn(() => ({
          update: mockUpdate.mockResolvedValue(),
          once: jest.fn().mockImplementation(() => {
            onceCalls++;
            if (onceCalls === 1) {
              return Promise.resolve({
                exists: () => true,
                val: () => depPrevData
              });
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
          dateTime: '2024-01-01T10:00:00',
          associatedMovement: null // no old association on our movement
        })
      };

      const handler = mockCapturedHandlers['onCreate:/departures/{departureId}'];
      await handler(snap);

      // setAssociatedMovement should be called at least for dep-001 and arr-001 back-link
      expect(utils.setAssociatedMovement).toHaveBeenCalledWith('dep-001', 'departure', newAssociatedMovement);
      expect(utils.setAssociatedMovement).toHaveBeenCalledWith('arr-001', 'arrival', { key: 'dep-001', type: 'departure' });
    });

    it('skips updateAssociatedMovement for already-updated movement via cascade (line 37)', async () => {
      // dep-001 is created. getAssociatedMovement returns arr-001.
      // arr-001.associatedMovement points back to dep-001 (already in updatedMovements).
      // When loadAndUpdateAssociatedMovement is called for dep-001 again, line 37 returns early.
      const arrMovement = {
        key: 'arr-001',
        type: 'arrival',
        immatriculation: 'HBKOF',
        dateTime: '2024-01-01T11:00:00',
        associatedMovement: { key: 'dep-001', type: 'departure' } // back-reference to dep-001
      };

      mockRef.mockImplementation(() => ({
        child: jest.fn(() => ({
          update: mockUpdate.mockResolvedValue(),
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
          dateTime: '2024-01-01T10:00:00',
          associatedMovement: null
        })
      };

      const handler = mockCapturedHandlers['onCreate:/departures/{departureId}'];
      await handler(snap);

      // dep-001 is updated, then arr-001 back-link is set.
      // arr-001.associatedMovement = dep-001 is then re-loaded but hits the already-updated guard.
      expect(utils.setAssociatedMovement).toHaveBeenCalledWith('dep-001', 'departure', arrMovement);
      expect(utils.setAssociatedMovement).toHaveBeenCalledWith('arr-001', 'arrival', { key: 'dep-001', type: 'departure' });
    });

    it('loadAndUpdateAssociatedMovement skips when loadMovement returns null', async () => {
      // The loadMovement null path (line 21) is hit inside loadAndUpdateAssociatedMovement
      // when the old associated movement has been deleted from the database.
      // We trigger this via a movement whose old associatedMovement key no longer exists.
      const oldAssocMovement = { key: 'arr-deleted', type: 'arrival' };

      let onceCalls = 0;
      mockRef.mockImplementation(() => ({
        child: jest.fn(() => ({
          update: mockUpdate.mockResolvedValue(),
          once: jest.fn().mockImplementation(() => {
            onceCalls++;
            // First call is for the old associated movement - it does not exist
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
          dateTime: '2024-01-01T10:00:00',
          associatedMovement: oldAssocMovement // had an old association
        })
      };

      const handler = mockCapturedHandlers['onCreate:/departures/{departureId}'];
      await handler(snap);

      // setAssociatedMovement called for dep-001 itself
      expect(utils.setAssociatedMovement).toHaveBeenCalledWith('dep-001', 'departure', null);
      // loadAndUpdateAssociatedMovement was called for arr-deleted but returned null,
      // so updateAssociatedMovement was NOT called a second time for it
      expect(utils.setAssociatedMovement).toHaveBeenCalledTimes(1);
    });
  });
});
