'use strict';

let mockCapturedHandler = null;

jest.mock('firebase-functions/v2/database', () => ({
  onValueWritten: jest.fn((opts, handler) => {
    mockCapturedHandler = handler;
  })
}));

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn()
};

jest.mock('firebase-functions/v2', () => ({
  logger: mockLogger
}));

jest.mock('firebase-functions/params', () => ({
  defineString: jest.fn(name => ({ name }))
}));

const mockAdmin = {
  database: jest.fn()
};

jest.mock('firebase-admin', () => mockAdmin);

require('./updateArrivalPaymentStatus');

describe('functions', () => {
  describe('updateArrivalPaymentStatus handleUpdate', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    const makeChange = (beforeVal, afterVal, afterKey = 'pay1') => ({
      before: {
        exists: () => beforeVal !== null,
        val: () => beforeVal,
        ref: { key: afterKey }
      },
      after: {
        exists: () => afterVal !== null,
        val: () => afterVal,
        ref: { key: afterKey }
      }
    });

    it('returns null when before does not exist', async () => {
      const change = makeChange(null, { status: 'success', arrivalReference: 'arr1' });
      const result = await mockCapturedHandler({ data: change });
      expect(result).toBeNull();
    });

    it('returns null when after does not exist', async () => {
      const change = makeChange({ status: 'pending' }, null);
      const result = await mockCapturedHandler({ data: change });
      expect(result).toBeNull();
    });

    it('returns when status did not change to success', async () => {
      const change = makeChange(
        { status: 'pending' },
        { status: 'pending', arrivalReference: 'arr1' }
      );
      const result = await mockCapturedHandler({ data: change });
      expect(result).toBeUndefined();
      expect(mockAdmin.database).not.toHaveBeenCalled();
    });

    it('logs info when arrivalReference is missing', async () => {
      const mockRef = {
        once: jest.fn().mockResolvedValue({
          val: () => ({ paymentMethod: { status: 'pending' } })
        }),
        update: jest.fn()
      };
      mockAdmin.database.mockReturnValue({
        ref: jest.fn().mockReturnValue({
          child: jest.fn().mockReturnValue(mockRef)
        })
      });

      const change = makeChange(
        { status: 'pending' },
        { status: 'success' }  // no arrivalReference
      );
      await mockCapturedHandler({ data: change });
      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('updates arrival payment status when status changes to success', async () => {
      const mockRef = {
        once: jest.fn().mockResolvedValue({
          val: () => ({ paymentMethod: { status: 'pending', method: 'card' } })
        }),
        update: jest.fn().mockResolvedValue()
      };

      mockAdmin.database.mockReturnValue({
        ref: jest.fn().mockReturnValue({
          child: jest.fn().mockReturnValue(mockRef)
        })
      });

      const change = makeChange(
        { status: 'pending' },
        { status: 'success', arrivalReference: 'arr1' }
      );

      await mockCapturedHandler({ data: change });

      expect(mockRef.update).toHaveBeenCalledWith({
        paymentMethod: { status: 'completed', method: 'card' }
      });
    });

    it('does not update when arrival payment method is not pending', async () => {
      const mockRef = {
        once: jest.fn().mockResolvedValue({
          val: () => ({ paymentMethod: { status: 'completed' } })
        }),
        update: jest.fn()
      };

      mockAdmin.database.mockReturnValue({
        ref: jest.fn().mockReturnValue({
          child: jest.fn().mockReturnValue(mockRef)
        })
      });

      const change = makeChange(
        { status: 'pending' },
        { status: 'success', arrivalReference: 'arr1' }
      );

      await mockCapturedHandler({ data: change });

      expect(mockRef.update).not.toHaveBeenCalled();
    });

    it('throws and logs error when database update fails', async () => {
      const mockRef = {
        once: jest.fn().mockResolvedValue({
          val: () => ({ paymentMethod: { status: 'pending' } })
        }),
        update: jest.fn().mockRejectedValue(new Error('DB error'))
      };

      mockAdmin.database.mockReturnValue({
        ref: jest.fn().mockReturnValue({
          child: jest.fn().mockReturnValue(mockRef)
        })
      });

      const change = makeChange(
        { status: 'pending' },
        { status: 'success', arrivalReference: 'arr1' }
      );

      await expect(mockCapturedHandler({ data: change })).rejects.toThrow('DB error');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
