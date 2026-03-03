jest.mock('./firebase');
jest.mock('firebase/database', () => ({
  get: jest.fn(),
}));

import firebase from './firebase';
import {get} from 'firebase/database';
import {fetch, get as getAerodrome, exists} from './aerodromes';

describe('util', () => {
  describe('aerodromes', () => {
    let mockRef;

    beforeEach(() => {
      mockRef = {};
      jest.clearAllMocks();
      firebase.mockReturnValue(mockRef);
    });

    describe('fetch', () => {
      it('resolves with aerodrome map from firebase snapshot', async () => {
        const records = [
          {key: 'lszt', val: () => ({name: 'Thun'})},
          {key: 'lspv', val: () => ({name: 'Payerne'})}
        ];
        get.mockResolvedValue({forEach: fn => records.forEach(fn)});

        const result = await fetch();
        expect(result).toEqual({
          lszt: {name: 'Thun'},
          lspv: {name: 'Payerne'}
        });
      });

      it('resolves with empty object when no aerodromes', async () => {
        get.mockResolvedValue({forEach: () => {}});

        const result = await fetch();
        expect(result).toEqual({});
      });
    });

    describe('get', () => {
      it('resolves with value when aerodrome exists', async () => {
        get.mockResolvedValue({exists: () => true, val: () => ({name: 'Thun'})});

        const result = await getAerodrome('lszt');
        expect(result).toEqual({name: 'Thun'});
        expect(firebase).toHaveBeenCalledWith('/aerodromes/lszt');
      });

      it('resolves with null when aerodrome does not exist', async () => {
        get.mockResolvedValue({exists: () => false, val: () => null});

        const result = await getAerodrome('unknown');
        expect(result).toBeNull();
      });
    });

    describe('exists', () => {
      it('resolves with false when aerodrome exists (key is not available)', async () => {
        get.mockResolvedValue({exists: () => true});

        const result = await exists('lszt');
        expect(result).toBe(false);
      });

      it('resolves with true when aerodrome does not exist', async () => {
        get.mockResolvedValue({exists: () => false});

        const result = await exists('unknown');
        expect(result).toBe(true);
      });

      it('resolves with true when firebase get rejects', async () => {
        get.mockRejectedValue(new Error('Permission denied'));

        const result = await exists('restricted');
        expect(result).toBe(true);
      });
    });
  });
});
