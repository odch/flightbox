jest.mock('../../util/firebase');
jest.mock('firebase/database', () => ({
  get: jest.fn(),
  query: jest.fn(r => r),
  orderByKey: jest.fn(),
  push: jest.fn(),
}));

import firebase from '../../util/firebase';
import {get, push} from 'firebase/database';
import {loadAll, save} from './remote';

describe('modules', () => {
  describe('messages/remote', () => {
    let mockRef;

    beforeEach(() => {
      mockRef = {};
      jest.clearAllMocks();
      firebase.mockReturnValue(mockRef);
    });

    describe('loadAll', () => {
      it('resolves with snapshot', async () => {
        const snapshot = {val: () => ({})};
        get.mockResolvedValue(snapshot);
        const result = await loadAll();
        expect(result).toBe(snapshot);
        expect(firebase).toHaveBeenCalledWith('/messages');
      });
    });

    describe('save', () => {
      it('resolves on successful push', async () => {
        push.mockResolvedValue({key: 'new-key'});
        await expect(save({name: 'Hans', message: 'Hello'})).resolves.toBeUndefined();
        expect(push).toHaveBeenCalledWith(
          mockRef,
          expect.objectContaining({name: 'Hans', timestamp: expect.any(Number)})
        );
      });

      it('rejects when push fails', async () => {
        push.mockRejectedValue(new Error('Push failed'));
        await expect(save({name: 'Hans'})).rejects.toThrow('Push failed');
      });
    });
  });
});
