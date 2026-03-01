jest.mock('./firebase');

import firebase from './firebase';
import {fetch, get, exists} from './aerodromes';

describe('util', () => {
  describe('aerodromes', () => {
    let mockRef;

    beforeEach(() => {
      mockRef = {
        once: jest.fn()
      };
      firebase.mockImplementation((path, callback) => {
        callback(null, mockRef);
      });
    });

    describe('fetch', () => {
      it('resolves with aerodrome map from firebase snapshot', async () => {
        const records = [
          {key: 'lszt', val: () => ({name: 'Thun'})},
          {key: 'lspv', val: () => ({name: 'Payerne'})}
        ];
        mockRef.once.mockImplementation((event, cb) => {
          cb({
            forEach: fn => records.forEach(fn)
          });
        });

        const result = await fetch();
        expect(result).toEqual({
          lszt: {name: 'Thun'},
          lspv: {name: 'Payerne'}
        });
      });

      it('resolves with empty object when no aerodromes', async () => {
        mockRef.once.mockImplementation((event, cb) => {
          cb({forEach: fn => {}});
        });

        const result = await fetch();
        expect(result).toEqual({});
      });
    });

    describe('get', () => {
      it('resolves with value when aerodrome exists', async () => {
        mockRef.once.mockImplementation((event, cb) => {
          cb({exists: () => true, val: () => ({name: 'Thun'})});
        });

        const result = await get('lszt');
        expect(result).toEqual({name: 'Thun'});
      });

      it('resolves with null when aerodrome does not exist', async () => {
        mockRef.once.mockImplementation((event, cb) => {
          cb({exists: () => false, val: () => null});
        });

        const result = await get('unknown');
        expect(result).toBeNull();
      });
    });

    describe('exists', () => {
      it('resolves with false when aerodrome exists (key is not available)', async () => {
        mockRef.once.mockImplementation((event, cb) => {
          cb({exists: () => true});
        });

        const result = await exists('lszt');
        expect(result).toBe(false);
      });

      it('resolves with true when aerodrome does not exist', async () => {
        mockRef.once.mockImplementation((event, cb) => {
          cb({exists: () => false});
        });

        const result = await exists('unknown');
        expect(result).toBe(true);
      });

      it('resolves with true when firebase error callback is triggered', async () => {
        mockRef.once.mockImplementation((event, successCb, errorCb) => {
          errorCb(new Error('Permission denied'));
        });

        const result = await exists('restricted');
        expect(result).toBe(true);
      });
    });
  });
});
