import expect from 'expect';
import MovementsArray from '../../util/MovementsArray.js';

describe('MovementsArray', () => {
  describe('creation', () => {
    it('is initialized with correct order', () => {
      const initialItems = [{
        key: 'm1',
        date: '2015-12-23',
        time: '10:15',
      }, {
        key: 'm2',
        date: '2015-12-21',
        time: '14:30',
      }, {
        key: 'm3',
        date: '2015-12-24',
        time: '08:30',
      }];

      const movementArr = new MovementsArray(initialItems);

      expect(movementArr.array.length, 3);
      expect(movementArr.array[0].key).toBe('m3');
      expect(movementArr.array[1].key).toBe('m1');
      expect(movementArr.array[2].key).toBe('m2');

      expect(movementArr.keys.length, 3);
      expect(movementArr.keys['m1']).toBe('2015-12-23T09:15:00.000Z');
      expect(movementArr.keys['m2']).toBe('2015-12-21T13:30:00.000Z');
      expect(movementArr.keys['m3']).toBe('2015-12-24T07:30:00.000Z');
    });

    it('throws error if key is missing', () => {
      const initialItems = [{
        date: '2015-12-23',
        time: '10:15',
      }];

      expect(() => new MovementsArray(initialItems)).toThrow('Property "key" is missing');
    });

    it('throws error if date is missing', () => {
      const initialItems = [{
        key: 'm1',
        time: '10:15',
      }];

      expect(() => new MovementsArray(initialItems)).toThrow('Property "date" is missing');
    });

    it('throws error if time is missing', () => {
      const initialItems = [{
        key: 'm1',
        date: '2015-12-23',
      }];

      expect(() => new MovementsArray(initialItems)).toThrow('Property "time" is missing');
    });
  });

  describe('insertion', () => {
    it('inserts new movement correctly', () => {
      const initialItems = [{
        key: 'm1',
        date: '2015-12-21',
        time: '14:30',
      }, {
        key: 'm2',
        date: '2015-12-24',
        time: '08:30',
      }];

      const movementArr = new MovementsArray(initialItems);
      const inserted = movementArr.insert({
        key: 'm3',
        date: '2015-12-23',
        time: '10:15',
      });

      expect(inserted).toBe(true);

      expect(movementArr.array.length, 3);
      expect(movementArr.array[0].key).toBe('m2');
      expect(movementArr.array[1].key).toBe('m3');
      expect(movementArr.array[2].key).toBe('m1');

      expect(movementArr.keys.length, 3);
      expect(movementArr.keys['m1']).toBe('2015-12-21T13:30:00.000Z');
      expect(movementArr.keys['m2']).toBe('2015-12-24T07:30:00.000Z');
      expect(movementArr.keys['m3']).toBe('2015-12-23T09:15:00.000Z');
    });

    it('does not insert existing movement again', () => {
      const initialItems = [{
        key: 'm1',
        date: '2015-12-21',
        time: '14:30',
      }, {
        key: 'm2',
        date: '2015-12-24',
        time: '08:30',
      }];

      const movementArr = new MovementsArray(initialItems);
      const inserted = movementArr.insert({
        key: 'm2',
        date: '2015-12-24',
        time: '08:30',
      });

      expect(inserted).toBe(false);

      expect(movementArr.array.length, 2);
      expect(movementArr.array[0].key).toBe('m2');
      expect(movementArr.array[1].key).toBe('m1');

      expect(movementArr.keys.length, 1);
      expect(movementArr.keys['m1']).toBe('2015-12-21T13:30:00.000Z');
      expect(movementArr.keys['m2']).toBe('2015-12-24T07:30:00.000Z');
    });

    it('throws error if key is missing', () => {
      const movement = {
        date: '2015-12-23',
        time: '10:15',
      };

      const movementArr = new MovementsArray([]);
      expect(() => movementArr.insert(movement)).toThrow('Property "key" is missing');
    });

    it('throws error if date is missing', () => {
      const movement = {
        key: 'm1',
        time: '10:15',
      };

      const movementArr = new MovementsArray([]);
      expect(() => movementArr.insert(movement)).toThrow('Property "date" is missing');
    });

    it('throws error if time is missing', () => {
      const movement = {
        key: 'm1',
        date: '2015-12-23',
      };

      const movementArr = new MovementsArray([]);
      expect(() => movementArr.insert(movement)).toThrow('Property "time" is missing');
    });
  });
});
