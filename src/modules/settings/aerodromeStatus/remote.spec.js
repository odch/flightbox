jest.mock('../../../util/firebase');

import firebase from '../../../util/firebase';
import {loadLatest, save} from './remote';

describe('modules', () => {
  describe('settings/aerodromeStatus/remote', () => {
    let mockRef;

    beforeEach(() => {
      mockRef = {
        orderByChild: jest.fn().mockReturnThis(),
        limitToLast: jest.fn().mockReturnThis(),
        once: jest.fn(),
        push: jest.fn(),
      };
      firebase.mockReturnValue(mockRef);
      firebase.mockImplementation((path, callback) => {
        if (typeof callback === 'function') {
          callback(null, mockRef);
        }
        return mockRef;
      });
    });

    describe('loadLatest', () => {
      it('resolves with snapshot ordered by timestamp', async () => {
        const snapshot = {val: () => ({})};
        mockRef.once.mockImplementation((event, cb) => cb(snapshot));
        const result = await loadLatest();
        expect(result).toBe(snapshot);
        expect(mockRef.orderByChild).toHaveBeenCalledWith('timestamp');
        expect(mockRef.limitToLast).toHaveBeenCalledWith(10);
      });
    });

    describe('save', () => {
      it('resolves on successful push', async () => {
        mockRef.push.mockImplementation((data, cb) => cb(null));
        await expect(save({status: 'open'})).resolves.toBeUndefined();
      });

      it('rejects on push error', async () => {
        const err = new Error('Save failed');
        mockRef.push.mockImplementation((data, cb) => cb(err));
        await expect(save({status: 'open'})).rejects.toThrow('Save failed');
      });
    });
  });
});
