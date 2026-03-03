'use strict';

// Capture handlers registered by the module
const mockCapturedHandlers = {};

jest.mock('firebase-functions', () => {
  const makeRef = (handlers) => (path) => ({
    onCreate: jest.fn(handler => {
      const key = `onCreate:${path}`;
      handlers[key] = handler;
    }),
    onWrite: jest.fn(handler => {
      const key = `onWrite:${path}`;
      handlers[key] = handler;
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
        ref: makeRef(mockCapturedHandlers)
      }))
    }
  };
});

const mockOnce = jest.fn();
const mockUpdate = jest.fn();
const mockRef = jest.fn();
const mockChild = jest.fn();

jest.mock('firebase-admin', () => ({
  database: jest.fn(() => ({
    ref: mockRef
  }))
}));

require('./enrichMovements');

// Helper to build a ref chain: .ref(path).child(icao).once(...)
const buildRefChain = (onceImpl) => {
  const chain = {
    child: jest.fn(() => ({
      once: onceImpl,
      update: mockUpdate
    })),
    once: onceImpl,
    update: mockUpdate
  };
  return chain;
};

describe('functions/enrichMovements', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getEnrichedData (via enrichMovementWithAerodromeMetadata)', () => {
    const callEnrichOnCreate = async (movementData, snapshotExists, aerodromeData) => {
      // Build a mock aerodrome snapshot
      const aerodromeSnapshot = {
        exists: jest.fn(() => snapshotExists),
        val: jest.fn(() => aerodromeData)
      };

      // When admin.database().ref('aerodromes').child(icao).once('value') is called
      mockRef.mockImplementation(path => {
        if (path === 'aerodromes') {
          return {
            child: jest.fn(() => ({
              once: jest.fn().mockResolvedValue(aerodromeSnapshot)
            }))
          };
        }
        // For the movement existence check and update (departures/arrivals)
        return {
          child: jest.fn(() => ({
            once: jest.fn().mockResolvedValue({ exists: () => true }),
            update: mockUpdate.mockResolvedValue()
          }))
        };
      });

      const snapshot = {
        ref: { key: 'mov-001' },
        val: jest.fn(() => movementData)
      };

      const handler = mockCapturedHandlers['onCreate:/departures/{departureId}'];
      await handler(snapshot);
    };

    it('enriches departure with aerodrome data when aerodrome exists', async () => {
      await callEnrichOnCreate(
        { location: 'lszh' },
        true,
        { name: 'Zurich', country: 'CH', timezone: 'Europe/Zurich' }
      );

      expect(mockUpdate).toHaveBeenCalledWith({
        locationName: 'Zurich',
        locationCountry: 'CH',
        locationTimezone: 'Europe/Zurich'
      });
    });

    it('converts location to uppercase for ICAO lookup', async () => {
      const childMock = jest.fn(() => ({
        once: jest.fn().mockResolvedValue({
          exists: () => true,
          val: () => ({ name: 'Test', country: 'CH', timezone: 'Europe/Zurich' })
        })
      }));

      mockRef.mockImplementation(path => {
        if (path === 'aerodromes') {
          return { child: childMock };
        }
        return {
          child: jest.fn(() => ({
            once: jest.fn().mockResolvedValue({ exists: () => true }),
            update: mockUpdate.mockResolvedValue()
          }))
        };
      });

      const snapshot = {
        ref: { key: 'mov-002' },
        val: () => ({ location: 'lszh' }) // lowercase
      };

      const handler = mockCapturedHandlers['onCreate:/departures/{departureId}'];
      await handler(snapshot);

      expect(childMock).toHaveBeenCalledWith('LSZH');
    });

    it('clears enriched data when aerodrome is not found', async () => {
      await callEnrichOnCreate(
        { location: 'XXXX' },
        false,
        null
      );

      expect(mockUpdate).toHaveBeenCalledWith({
        locationName: null,
        locationCountry: null,
        locationTimezone: null
      });
    });

    it('handles missing optional aerodrome fields with null', async () => {
      await callEnrichOnCreate(
        { location: 'LSZH' },
        true,
        { name: 'Zurich' } // no country or timezone
      );

      expect(mockUpdate).toHaveBeenCalledWith({
        locationName: 'Zurich',
        locationCountry: null,
        locationTimezone: null
      });
    });

    it('does not call update when data has not changed', async () => {
      const aerodromeSnapshot = {
        exists: () => true,
        val: () => ({ name: 'Zurich', country: 'CH', timezone: 'Europe/Zurich' })
      };

      mockRef.mockImplementation(path => {
        if (path === 'aerodromes') {
          return {
            child: jest.fn(() => ({
              once: jest.fn().mockResolvedValue(aerodromeSnapshot)
            }))
          };
        }
        return {
          child: jest.fn(() => ({ update: mockUpdate.mockResolvedValue() }))
        };
      });

      const snapshot = {
        ref: { key: 'mov-003' },
        // Movement already has matching enriched data - no change needed
        val: () => ({
          location: 'LSZH',
          locationName: 'Zurich',
          locationCountry: 'CH',
          locationTimezone: 'Europe/Zurich'
        })
      };

      const handler = mockCapturedHandlers['onCreate:/departures/{departureId}'];
      await handler(snapshot);

      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('skips enrichment when movement has no location', async () => {
      mockRef.mockImplementation(() => ({
        child: jest.fn(() => ({ once: mockOnce }))
      }));

      const snapshot = {
        ref: { key: 'mov-004' },
        val: () => ({}) // no location field
      };

      const handler = mockCapturedHandlers['onCreate:/departures/{departureId}'];
      await handler(snapshot);

      expect(mockOnce).not.toHaveBeenCalled();
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('skips enrichment when movement is null', async () => {
      mockRef.mockImplementation(() => ({
        child: jest.fn(() => ({ once: mockOnce }))
      }));

      const snapshot = {
        ref: { key: 'mov-005' },
        val: () => null
      };

      const handler = mockCapturedHandlers['onCreate:/departures/{departureId}'];
      await handler(snapshot);

      expect(mockOnce).not.toHaveBeenCalled();
    });

    it('throws and rethrows on database error', async () => {
      mockRef.mockImplementation(path => {
        if (path === 'aerodromes') {
          return {
            child: jest.fn(() => ({
              once: jest.fn().mockRejectedValue(new Error('DB error'))
            }))
          };
        }
        return {};
      });

      const snapshot = {
        ref: { key: 'mov-006' },
        val: () => ({ location: 'LSZH' })
      };

      const handler = mockCapturedHandlers['onCreate:/departures/{departureId}'];
      await expect(handler(snapshot)).rejects.toThrow('DB error');
    });
  });

  describe('enrichOnCreate for arrivals', () => {
    it('uses arrivals path when enriching arrival', async () => {
      const aerodromeSnapshot = {
        exists: () => true,
        val: () => ({ name: 'Bern', country: 'CH', timezone: 'Europe/Zurich' })
      };

      const updateMock = jest.fn().mockResolvedValue();
      const childForMovement = jest.fn(() => ({
        once: jest.fn().mockResolvedValue({ exists: () => true }),
        update: updateMock
      }));

      mockRef.mockImplementation(path => {
        if (path === 'aerodromes') {
          return {
            child: jest.fn(() => ({
              once: jest.fn().mockResolvedValue(aerodromeSnapshot)
            }))
          };
        }
        if (path === 'arrivals') {
          return { child: childForMovement };
        }
        return { child: jest.fn(() => ({ update: jest.fn() })) };
      });

      const snapshot = {
        ref: { key: 'arr-001' },
        val: () => ({ location: 'LSZB' })
      };

      const handler = mockCapturedHandlers['onCreate:/arrivals/{arrivalId}'];
      await handler(snapshot);

      expect(childForMovement).toHaveBeenCalledWith('arr-001');
      expect(updateMock).toHaveBeenCalled();
    });
  });

  describe('handleUpdate / enrichOnUpdate', () => {
    const callEnrichOnWrite = async (beforeVal, afterVal) => {
      const change = {
        before: {
          exists: () => !!beforeVal,
          val: () => beforeVal,
          ref: { key: 'dep-001' }
        },
        after: {
          exists: () => !!afterVal,
          val: () => afterVal,
          ref: { key: 'dep-001' }
        }
      };

      const handler = mockCapturedHandlers['onWrite:/departures/{departureId}'];
      return handler(change);
    };

    it('returns null when before does not exist (create event)', async () => {
      const result = await callEnrichOnWrite(null, { location: 'LSZH' });
      expect(result).toBeNull();
    });

    it('returns null when after does not exist (delete event)', async () => {
      const result = await callEnrichOnWrite({ location: 'LSZH' }, null);
      expect(result).toBeNull();
    });

    it('enriches when location changes', async () => {
      const aerodromeSnapshot = {
        exists: () => true,
        val: () => ({ name: 'Geneva', country: 'CH', timezone: 'Europe/Zurich' })
      };

      mockRef.mockImplementation(path => {
        if (path === 'aerodromes') {
          return {
            child: jest.fn(() => ({
              once: jest.fn().mockResolvedValue(aerodromeSnapshot)
            }))
          };
        }
        return {
          child: jest.fn(() => ({
            once: jest.fn().mockResolvedValue({ exists: () => true }),
            update: mockUpdate.mockResolvedValue()
          }))
        };
      });

      await callEnrichOnWrite(
        { location: 'LSZH', locationName: 'Zurich', locationCountry: 'CH', locationTimezone: 'Europe/Zurich' },
        { location: 'LSGG', locationName: 'Zurich', locationCountry: 'CH', locationTimezone: 'Europe/Zurich' }
      );

      expect(mockUpdate).toHaveBeenCalled();
    });

    it('enriches when location metadata is missing', async () => {
      const aerodromeSnapshot = {
        exists: () => true,
        val: () => ({ name: 'Zurich', country: 'CH', timezone: 'Europe/Zurich' })
      };

      mockRef.mockImplementation(path => {
        if (path === 'aerodromes') {
          return {
            child: jest.fn(() => ({
              once: jest.fn().mockResolvedValue(aerodromeSnapshot)
            }))
          };
        }
        return {
          child: jest.fn(() => ({
            once: jest.fn().mockResolvedValue({ exists: () => true }),
            update: mockUpdate.mockResolvedValue()
          }))
        };
      });

      await callEnrichOnWrite(
        { location: 'LSZH' },
        { location: 'LSZH' } // same location but no metadata yet
      );

      expect(mockUpdate).toHaveBeenCalled();
    });

    it('does not enrich when location unchanged and metadata complete', async () => {
      // Same location, all metadata present - no update needed
      mockRef.mockImplementation(() => ({
        child: jest.fn(() => ({
          once: jest.fn(),
          update: mockUpdate
        }))
      }));

      await callEnrichOnWrite(
        { location: 'LSZH', locationName: 'X', locationCountry: 'CH', locationTimezone: 'TZ' },
        { location: 'LSZH', locationName: 'X', locationCountry: 'CH', locationTimezone: 'TZ' }
      );

      // No aerodrome lookup or update since location is same and metadata is complete
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });
});
