jest.mock('../../util/firebase');

import firebase from '../../util/firebase';
import {loadAll, save} from './remote';

describe('modules', () => {
  describe('messages/remote', () => {
    let mockRef;

    beforeEach(() => {
      mockRef = {
        orderByKey: jest.fn().mockReturnThis(),
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

    describe('loadAll', () => {
      it('resolves with snapshot', async () => {
        const snapshot = {val: () => ({})};
        mockRef.once.mockImplementation((event, cb) => cb(snapshot));
        const result = await loadAll();
        expect(result).toBe(snapshot);
        expect(mockRef.orderByKey).toHaveBeenCalled();
      });
    });

    describe('save', () => {
      it('resolves on successful push', async () => {
        mockRef.push.mockImplementation((data, cb) => cb(null));
        await expect(save({name: 'Hans', message: 'Hello'})).resolves.toBeUndefined();
        expect(mockRef.push).toHaveBeenCalledWith(
          expect.objectContaining({name: 'Hans', timestamp: expect.any(Number)}),
          expect.any(Function)
        );
      });

      it('rejects on push error', async () => {
        const err = new Error('Push failed');
        mockRef.push.mockImplementation((data, cb) => cb(err));
        await expect(save({name: 'Hans'})).rejects.toThrow('Push failed');
      });
    });
  });
});
