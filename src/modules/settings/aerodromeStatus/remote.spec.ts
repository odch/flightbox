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
import {loadLatest, save, fetchCurrentStatus} from './remote';

describe('modules', () => {
  describe('settings/aerodromeStatus/remote', () => {
    let mockRef;

    beforeEach(() => {
      mockRef = {};
      jest.clearAllMocks();
      (firebase as jest.Mock).mockReturnValue(mockRef);
    });

    describe('loadLatest', () => {
      it('resolves with snapshot ordered by timestamp', async () => {
        const snapshot = {val: () => ({})};
        (get as jest.Mock).mockResolvedValue(snapshot);
        const result = await loadLatest();
        expect(result).toBe(snapshot);
        expect(firebase).toHaveBeenCalledWith('/status');
      });
    });

    describe('save', () => {
      it('resolves on successful push', async () => {
        (push as jest.Mock).mockResolvedValue({key: 'new-key'});
        await expect(save({status: 'open'})).resolves.toBeUndefined();
        expect(push).toHaveBeenCalledWith(mockRef, {status: 'open'});
      });

      it('rejects on push error', async () => {
        (push as jest.Mock).mockRejectedValue(new Error('Save failed'));
        await expect(save({status: 'open'})).rejects.toThrow('Save failed');
      });
    });

    describe('fetchCurrentStatus', () => {
      beforeEach(() => {
        (global as any).__FIREBASE_PROJECT_ID__ = 'test-project';
        (global as any).fetch = jest.fn();
      });

      it('fetches the public status endpoint and resolves the parsed JSON', async () => {
        const body = {status: 'open', message: 'hi', last_update_date: '2020-03-17T11:15:00.000Z'};
        (global.fetch as jest.Mock).mockResolvedValue({json: () => Promise.resolve(body)});

        const result = await fetchCurrentStatus();

        expect(result).toEqual(body);
        expect(global.fetch).toHaveBeenCalledWith(
          'https://europe-west1-test-project.cloudfunctions.net/api/aerodrome/status'
        );
      });
    });
  });
});
