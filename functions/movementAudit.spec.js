'use strict';

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
        ref: makeRef(mockCapturedHandlers)
      }))
    }
  };
  mock.region = jest.fn(() => mock);
  return mock;
});

const mockOnce = jest.fn();
const mockUpdate = jest.fn();
const mockRef = jest.fn();
const mockChild = jest.fn();

jest.mock('firebase-admin', () => ({
  database: Object.assign(
    jest.fn(() => ({
      ref: mockRef
    })),
    {
      ServerValue: {
        TIMESTAMP: 'SERVER_TIMESTAMP'
      }
    }
  )
}));

require('./movementAudit');

const buildRefChain = (onceImpl, updateImpl) => {
  mockChild.mockReturnValue({
    once: onceImpl || mockOnce,
    update: updateImpl || mockUpdate
  });
  mockRef.mockReturnValue({
    child: mockChild
  });
};

const makeSnapshot = (key, val) => ({
  ref: { key },
  val: () => val,
  exists: () => val !== null
});

const makeChange = (beforeKey, beforeVal, afterKey, afterVal) => ({
  before: {
    exists: () => beforeVal !== null,
    val: () => beforeVal,
    ref: { key: beforeKey }
  },
  after: {
    exists: () => afterVal !== null,
    val: () => afterVal,
    ref: { key: afterKey }
  }
});

describe('movementAudit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdate.mockResolvedValue(undefined);
  });

  describe('onCreate triggers', () => {
    const departureOnCreate = mockCapturedHandlers['onCreate:/departures/{departureId}'];
    const arrivalOnCreate = mockCapturedHandlers['onCreate:/arrivals/{arrivalId}'];

    it('should register onCreate triggers', () => {
      expect(departureOnCreate).toBeDefined();
      expect(arrivalOnCreate).toBeDefined();
    });

    it('should set audit fields on departure create for USER auth', async () => {
      const snapshot = makeSnapshot('dep1', {
        immatriculation: 'HBABC',
        negativeTimestamp: -1476021600000
      });

      const context = {
        authType: 'USER',
        auth: { uid: 'user123' }
      };

      const userSnapshot = {
        exists: () => true,
        val: () => ({ email: 'pilot@example.com', firstname: 'John', lastname: 'Doe' })
      };

      buildRefChain(
        jest.fn().mockResolvedValue(userSnapshot),
        mockUpdate
      );

      await departureOnCreate(snapshot, context);

      expect(mockRef).toHaveBeenCalledWith('users');
      expect(mockChild).toHaveBeenCalledWith('user123');
      expect(mockRef).toHaveBeenCalledWith('departures');
      expect(mockChild).toHaveBeenCalledWith('dep1');
      expect(mockUpdate).toHaveBeenCalledWith({
        createdAt: 'SERVER_TIMESTAMP',
        createdBy: 'pilot@example.com',
        createdByName: 'John Doe',
        createdBy_orderKey: 'pilot@example.com_1476021600000'
      });
    });

    it('should set audit fields on arrival create for USER auth', async () => {
      const snapshot = makeSnapshot('arr1', {
        immatriculation: 'HBXYZ',
        negativeTimestamp: -1476021600000
      });

      const context = {
        authType: 'USER',
        auth: { uid: 'user456' }
      };

      const userSnapshot = {
        exists: () => true,
        val: () => ({ email: 'pilot2@example.com', firstname: 'Jane', lastname: 'Smith' })
      };

      buildRefChain(
        jest.fn().mockResolvedValue(userSnapshot),
        mockUpdate
      );

      await arrivalOnCreate(snapshot, context);

      expect(mockRef).toHaveBeenCalledWith('arrivals');
      expect(mockChild).toHaveBeenCalledWith('arr1');
      expect(mockUpdate).toHaveBeenCalledWith({
        createdAt: 'SERVER_TIMESTAMP',
        createdBy: 'pilot2@example.com',
        createdByName: 'Jane Smith',
        createdBy_orderKey: 'pilot2@example.com_1476021600000'
      });
    });

    it('should skip if authType is not USER', async () => {
      const snapshot = makeSnapshot('dep1', { immatriculation: 'HBABC' });
      const context = { authType: 'ADMIN' };

      const result = await departureOnCreate(snapshot, context);

      expect(result).toBeNull();
      expect(mockRef).not.toHaveBeenCalled();
    });

    it('should set createdAt even if user not found', async () => {
      const snapshot = makeSnapshot('dep1', {
        immatriculation: 'HBABC',
        negativeTimestamp: -1476021600000
      });

      const context = {
        authType: 'USER',
        auth: { uid: 'unknown-user' }
      };

      const userSnapshot = {
        exists: () => false,
        val: () => null
      };

      buildRefChain(
        jest.fn().mockResolvedValue(userSnapshot),
        mockUpdate
      );

      await departureOnCreate(snapshot, context);

      expect(mockUpdate).toHaveBeenCalledWith({
        createdAt: 'SERVER_TIMESTAMP'
      });
    });

    it('should set createdBy to null if user found but email is undefined', async () => {
      const snapshot = makeSnapshot('dep1', {
        immatriculation: 'HBABC',
        negativeTimestamp: -1476021600000
      });

      const context = {
        authType: 'USER',
        auth: { uid: 'user-no-email' }
      };

      const userSnapshot = {
        exists: () => true,
        val: () => ({ firstname: 'John', lastname: 'Doe' })
      };

      buildRefChain(
        jest.fn().mockResolvedValue(userSnapshot),
        mockUpdate
      );

      await departureOnCreate(snapshot, context);

      expect(mockUpdate).toHaveBeenCalledWith({
        createdAt: 'SERVER_TIMESTAMP',
        createdBy: null,
        createdByName: 'John Doe'
      });
    });
  });

  describe('onWrite triggers (update)', () => {
    const departureOnWrite = mockCapturedHandlers['onWrite:/departures/{departureId}'];
    const arrivalOnWrite = mockCapturedHandlers['onWrite:/arrivals/{arrivalId}'];

    it('should register onWrite triggers', () => {
      expect(departureOnWrite).toBeDefined();
      expect(arrivalOnWrite).toBeDefined();
    });

    it('should set updatedBy/updatedAt on departure update for USER auth', async () => {
      const change = makeChange('dep1', {
        immatriculation: 'HBABC',
        location: 'LSZT'
      }, 'dep1', {
        immatriculation: 'HBABC',
        location: 'LSZH'
      });

      const context = {
        authType: 'USER',
        auth: { uid: 'user123' }
      };

      const userSnapshot = {
        exists: () => true,
        val: () => ({ email: 'pilot@example.com', firstname: 'John', lastname: 'Doe' })
      };

      buildRefChain(
        jest.fn().mockResolvedValue(userSnapshot),
        mockUpdate
      );

      await departureOnWrite(change, context);

      expect(mockUpdate).toHaveBeenCalledWith({
        updatedAt: 'SERVER_TIMESTAMP',
        updatedBy: 'pilot@example.com',
        updatedByName: 'John Doe'
      });
    });

    it('should skip if authType is not USER', async () => {
      const change = makeChange('dep1', { immatriculation: 'HBABC' }, 'dep1', { immatriculation: 'HBXYZ' });
      const context = { authType: 'ADMIN' };

      const result = await departureOnWrite(change, context);

      expect(result).toBeNull();
      expect(mockRef).not.toHaveBeenCalled();
    });

    it('should skip if before does not exist (create case)', async () => {
      const change = makeChange('dep1', null, 'dep1', { immatriculation: 'HBABC' });
      const context = { authType: 'USER', auth: { uid: 'user123' } };

      const result = await departureOnWrite(change, context);

      expect(result).toBeNull();
      expect(mockRef).not.toHaveBeenCalled();
    });

    it('should skip if after does not exist (delete case)', async () => {
      const change = makeChange('dep1', { immatriculation: 'HBABC' }, 'dep1', null);
      const context = { authType: 'USER', auth: { uid: 'user123' } };

      const result = await departureOnWrite(change, context);

      expect(result).toBeNull();
      expect(mockRef).not.toHaveBeenCalled();
    });

    it('should skip if only audit fields changed (prevent infinite loop)', async () => {
      const change = makeChange('dep1', {
        immatriculation: 'HBABC',
        location: 'LSZT'
      }, 'dep1', {
        immatriculation: 'HBABC',
        location: 'LSZT',
        updatedBy: 'pilot@example.com',
        updatedByName: 'John Doe',
        updatedAt: 1234567890
      });

      const context = {
        authType: 'USER',
        auth: { uid: 'user123' }
      };

      const result = await departureOnWrite(change, context);

      expect(result).toBeNull();
      expect(mockRef).not.toHaveBeenCalled();
    });
  });
});
