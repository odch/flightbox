describe('functions', () => {
  describe('updateArrivalPaymentStatus handleUpdate', () => {
    let mockAdmin;
    let mockFunctions;
    let capturedHandler;

    beforeEach(() => {
      jest.resetModules();

      capturedHandler = null;
      mockAdmin = {
        database: jest.fn()
      };
      mockFunctions = {
        config: jest.fn().mockReturnValue({ rtdb: { instance: 'test-instance' } }),
        logger: { info: jest.fn(), error: jest.fn() },
        region: jest.fn().mockReturnValue({
          database: {
            instance: jest.fn().mockReturnValue({
              ref: jest.fn().mockReturnValue({
                onWrite: jest.fn().mockImplementation(fn => { capturedHandler = fn; })
              })
            })
          }
        })
      };

      jest.mock('firebase-admin', () => mockAdmin);
      jest.mock('firebase-functions', () => mockFunctions);

      require('./updateArrivalPaymentStatus');
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
      const result = await capturedHandler(change);
      expect(result).toBeNull();
    });

    it('returns null when after does not exist', async () => {
      const change = makeChange({ status: 'pending' }, null);
      const result = await capturedHandler(change);
      expect(result).toBeNull();
    });

    it('returns when status did not change to success', async () => {
      const change = makeChange(
        { status: 'pending' },
        { status: 'pending', arrivalReference: 'arr1' }
      );
      const result = await capturedHandler(change);
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
      await capturedHandler(change);
      expect(mockFunctions.logger.info).toHaveBeenCalled();
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

      await capturedHandler(change);

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

      await capturedHandler(change);

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

      await expect(capturedHandler(change)).rejects.toThrow('DB error');
      expect(mockFunctions.logger.error).toHaveBeenCalled();
    });
  });
});
