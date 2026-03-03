jest.mock('../../util/firebase');
jest.mock('firebase/database', () => ({
  get: jest.fn(),
  update: jest.fn(),
}));

import firebase from '../../util/firebase';
import {get, update} from 'firebase/database';
import {load, save} from './remote';

describe('modules', () => {
  describe('profile/remote', () => {
    let mockRef;

    beforeEach(() => {
      mockRef = {};
      jest.clearAllMocks();
      (firebase as jest.Mock).mockReturnValue(mockRef);
    });

    describe('load', () => {
      it('resolves with snapshot', async () => {
        const snapshot = {val: () => ({firstname: 'Hans'})};
        (get as jest.Mock).mockResolvedValue(snapshot);
        const result = await load('user123');
        expect(result).toBe(snapshot);
        expect(firebase).toHaveBeenCalledWith('/profiles/user123');
        expect(get).toHaveBeenCalledWith(mockRef);
      });
    });

    describe('save', () => {
      it('resolves when update succeeds', async () => {
        (update as jest.Mock).mockResolvedValue(undefined);
        await expect(save('user123', {firstname: 'Hans'})).resolves.toBeUndefined();
        expect(firebase).toHaveBeenCalledWith('/profiles/user123');
        expect(update).toHaveBeenCalledWith(mockRef, {firstname: 'Hans'});
      });

      it('rejects when update fails', async () => {
        (update as jest.Mock).mockRejectedValue(new Error('Permission denied'));
        await expect(save('user123', {})).rejects.toThrow('Permission denied');
      });
    });
  });
});
