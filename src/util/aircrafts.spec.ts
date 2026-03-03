jest.mock('./firebase');
jest.mock('firebase/database', () => ({
  get: jest.fn(),
}));

import firebase from './firebase';
import {get} from 'firebase/database';
import {fetch, REGISTRATION_REGEX} from './aircrafts';

describe('util', () => {
  describe('aircrafts', () => {
    let mockRef;

    beforeEach(() => {
      mockRef = {};
      jest.clearAllMocks();
      (firebase as jest.Mock).mockReturnValue(mockRef);
    });

    describe('REGISTRATION_REGEX', () => {
      it('matches non-alphanumeric characters', () => {
        expect('HB-KOF'.replace(REGISTRATION_REGEX, '')).toBe('HBKOF');
      });

      it('does not match uppercase alphanumeric', () => {
        expect('HBKOF'.replace(REGISTRATION_REGEX, '')).toBe('HBKOF');
      });
    });

    describe('fetch', () => {
      it('returns club and homeBase aircraft maps', async () => {
        (get as jest.Mock).mockResolvedValue({
          forEach: fn => {
            fn({key: 'HBKOF', val: () => ({name: 'Cessna'})});
          }
        });

        const result = await fetch();
        expect(result).toHaveProperty('club');
        expect(result).toHaveProperty('homeBase');
        expect(result.club['HBKOF']).toBe(true);
        expect(result.homeBase['HBKOF']).toBe(true);
      });

      it('returns empty maps when no aircraft', async () => {
        (get as jest.Mock).mockResolvedValue({forEach: () => {}});

        const result = await fetch();
        expect(result.club).toEqual({});
        expect(result.homeBase).toEqual({});
      });
    });
  });
});
