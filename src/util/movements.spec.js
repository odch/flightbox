import expect from 'expect';
import { localToFirebase, firebaseToLocal, compareDescending, compareAscending, isLocked, transferValues } from './movements';

describe('movements', () => {
  describe('local to firebase', () => {
    it('replaces local date with UTC', () => {
      const movement = {
        date: '2015-12-25',
        time: '13:30',
      };

      const forFirebase = localToFirebase(movement);

      expect(forFirebase.date).toBe(undefined);
      expect(forFirebase.time).toBe(undefined);
      expect(forFirebase.dateTime).toBe('2015-12-25T12:30:00.000Z');
    });

    it('adds negative timestamp', () => {
      const movement = {
        date: '2015-12-25',
        time: '13:30',
      };

      const forFirebase = localToFirebase(movement);

      expect(forFirebase.negativeTimestamp).toBe(-1451046600000);
    });

    it('lets other values unchanged', () => {
      const movement = {
        date: '2015-12-25',
        time: '13:30',
        aircraftType: 'DR40',
      };

      const forFirebase = localToFirebase(movement);

      expect(forFirebase.aircraftType).toBe('DR40');
    });
  });

  describe('firebase to local', () => {
    it('replaces UTC with local date', () => {
      const movement = {
        dateTime: '2015-12-25T12:30:00.000Z',
      };

      const local = firebaseToLocal(movement);

      expect(local.date).toBe('2015-12-25');
      expect(local.time).toBe('13:30');
      expect(local.dateTime).toBe(undefined);
    });

    it('removes negative timestamp', () => {
      const movement = {
        dateTime: '2015-12-25T12:30:00.000Z',
        negativeTimestamp: -1451046600000,
      };

      const local = firebaseToLocal(movement);

      expect(local.negativeTimestamp).toBe(undefined);
    });

    it('lets other values unchanged', () => {
      const movement = {
        dateTime: '2015-12-25T12:30:00.000Z',
        aircraftType: 'DR40',
      };

      const local = firebaseToLocal(movement);

      expect(local.aircraftType).toBe('DR40');
    });
  });

  describe('compareDescending', () => {
    it('returns 1 if first movement is before second movement', () => {
      const a = {
        date: '2016-03-07',
        time: '09:45',
      };
      const b = {
        date: '2016-03-08',
        time: '08:30',
      };

      expect(compareDescending(a, b)).toBe(1);
    });

    it('returns -1 if first movement is after second movement', () => {
      const a = {
        date: '2016-03-08',
        time: '08:30',
      };
      const b = {
        date: '2016-03-07',
        time: '09:45',
      };

      expect(compareDescending(a, b)).toBe(-1);
    });

    it('returns 1 if same time and immatriculation of a comes after b (lexicographically)', () => {
      const a = {
        date: '2016-03-08',
        time: '08:30',
        immatriculation: 'HB-KOF',
      };
      const b = {
        date: '2016-03-08',
        time: '08:30',
        immatriculation: 'HB-KFW',
      };

      expect(compareDescending(a, b)).toBe(1);
    });

    it('returns -1 if same time and immatriculation of a comes before b (lexicographically)', () => {
      const a = {
        date: '2016-03-08',
        time: '08:30',
        immatriculation: 'HB-KFW',
      };
      const b = {
        date: '2016-03-08',
        time: '08:30',
        immatriculation: 'HB-KOF',
      };

      expect(compareDescending(a, b)).toBe(-1);
    });
  });

  describe('compareAscending', () => {
    it('returns -1 if first movement is before second movement', () => {
      const a = {
        date: '2016-03-07',
        time: '09:45',
      };
      const b = {
        date: '2016-03-08',
        time: '08:30',
      };

      expect(compareAscending(a, b)).toBe(-1);
    });

    it('returns 1 if first movement is after second movement', () => {
      const a = {
        date: '2016-03-08',
        time: '08:30',
      };
      const b = {
        date: '2016-03-07',
        time: '09:45',
      };

      expect(compareAscending(a, b)).toBe(1);
    });

    it('returns 1 if same time and immatriculation of a comes after b (lexicographically)', () => {
      const a = {
        date: '2016-03-08',
        time: '08:30',
        immatriculation: 'HB-KOF',
      };
      const b = {
        date: '2016-03-08',
        time: '08:30',
        immatriculation: 'HB-KFW',
      };

      expect(compareAscending(a, b)).toBe(1);
    });

    it('returns -1 if same time and immatriculation of a comes before b (lexicographically)', () => {
      const a = {
        date: '2016-03-08',
        time: '08:30',
        immatriculation: 'HB-KFW',
      };
      const b = {
        date: '2016-03-08',
        time: '08:30',
        immatriculation: 'HB-KOF',
      };

      expect(compareAscending(a, b)).toBe(-1);
    });
  });

  describe('isLocked', () => {
    it('returns true if movement is before lock date', () => {
      const movement = {
        date: '2016-03-06',
        time: '09:45',
      };
      const lockDate = new Date('2016-03-07').getTime();

      expect(isLocked(movement, lockDate)).toBe(true);
    });

    it('returns true if movement is at lock date', () => {
      const movement = {
        date: '2016-03-07',
        time: '23:59',
      };
      const lockDate = new Date('2016-03-07').getTime();

      expect(isLocked(movement, lockDate)).toBe(true);
    });

    it('returns true if movement is after lock date', () => {
      const movement = {
        date: '2016-03-08',
        time: '00:00',
      };
      const lockDate = new Date('2016-03-07').getTime();

      expect(isLocked(movement, lockDate)).toBe(false);
    });
  });

  describe('transferValues', () => {
    it('transfers values which are not undefined and not null', () => {
      const source = {
        val1: undefined,
        val2: null,
        val3: 'foo',
      };
      const target = {};

      transferValues(source, target, ['val1', 'val2', 'val3']);

      const props = [];

      for (const key in target) {
        if (target.hasOwnProperty(key)) {
          props.push(key);
        }
      }

      expect(props.length).toBe(1);
      expect(props[0]).toBe('val3');
      expect(target.val3).toBe('foo');
    });

    it('takes default value if value is null or undefined', () => {
      const source = {
        val1: undefined,
      };
      const target = {};

      transferValues(source, target, [{ name: 'val1', defaultValue: 0 }]);

      expect(target.val1).toBe(0);
    });
  });
});
