jest.mock('../../../util/firebase');
jest.mock('firebase/database', () => ({
  get: jest.fn(),
  query: jest.fn(r => r),
  orderByChild: jest.fn(),
  limitToLast: jest.fn(),
  push: jest.fn(),
}));

import firebase from '../../../util/firebase';
import {get, push} from 'firebase/database';
import {loadLatest, save} from './remote';

describe('modules', () => {
  describe('settings/aerodromeStatus/remote', () => {
    let mockRef;

    beforeEach(() => {
      mockRef = {};
      jest.clearAllMocks();
      firebase.mockReturnValue(mockRef);
    });

    describe('loadLatest', () => {
      it('resolves with snapshot ordered by timestamp', async () => {
        const snapshot = {val: () => ({})};
        get.mockResolvedValue(snapshot);
        const result = await loadLatest();
        expect(result).toBe(snapshot);
        expect(firebase).toHaveBeenCalledWith('/status');
      });
    });

    describe('save', () => {
      it('resolves on successful push', async () => {
        push.mockResolvedValue({key: 'new-key'});
        await expect(save({status: 'open'})).resolves.toBeUndefined();
        expect(push).toHaveBeenCalledWith(mockRef, {status: 'open'});
      });

      it('rejects on push error', async () => {
        push.mockRejectedValue(new Error('Save failed'));
        await expect(save({status: 'open'})).rejects.toThrow('Save failed');
      });
    });
  });
});
