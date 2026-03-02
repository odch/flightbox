jest.mock('../../util/firebase');

import firebase from '../../util/firebase';
import {load, save} from './remote';

describe('modules', () => {
  describe('profile/remote', () => {
    let mockRef;

    beforeEach(() => {
      mockRef = {
        once: jest.fn(),
        update: jest.fn().mockResolvedValue(),
      };
      firebase.mockReturnValue(mockRef);
    });

    describe('load', () => {
      it('resolves with snapshot', async () => {
        const snapshot = {val: () => ({firstname: 'Hans'})};
        mockRef.once.mockImplementation((event, cb) => cb(snapshot));
        const result = await load('user123');
        expect(result).toBe(snapshot);
        expect(firebase).toHaveBeenCalledWith('/profiles/user123');
      });
    });

    describe('save', () => {
      it('resolves when update succeeds', async () => {
        await expect(save('user123', {firstname: 'Hans'})).resolves.toBeUndefined();
        expect(mockRef.update).toHaveBeenCalledWith({firstname: 'Hans'});
      });

      it('rejects when update fails', async () => {
        mockRef.update.mockRejectedValue(new Error('Permission denied'));
        await expect(save('user123', {})).rejects.toThrow('Permission denied');
      });
    });
  });
});
