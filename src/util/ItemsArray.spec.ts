import ItemsArray from './ItemsArray';
import { compareDescending } from './movements';

describe('util', () => {
  describe('ItemsArray', () => {
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

        const movementArr = new ItemsArray(initialItems, compareDescending);

        expect(movementArr.array.length).toBe(3);
        expect(movementArr.array[0].key).toBe('m3');
        expect(movementArr.array[1].key).toBe('m1');
        expect(movementArr.array[2].key).toBe('m2');

        expect(Object.keys(movementArr.keys).length).toBe(3);
        expect(movementArr.keys['m1']).toBe(true);
        expect(movementArr.keys['m2']).toBe(true);
        expect(movementArr.keys['m3']).toBe(true);
      });

      it('throws error if key is missing', () => {
        const initialItems = [{
          date: '2015-12-23',
          time: '10:15',
        }];

        expect(() => new ItemsArray(initialItems, compareDescending)).toThrow('Property "key" is missing');
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

        const movementArr = new ItemsArray(initialItems, compareDescending);
        const inserted = movementArr.insert({
          key: 'm3',
          date: '2015-12-23',
          time: '10:15',
        });

        expect(inserted).toBe(true);

        expect(movementArr.array.length).toBe(3);
        expect(movementArr.array[0].key).toBe('m2');
        expect(movementArr.array[1].key).toBe('m3');
        expect(movementArr.array[2].key).toBe('m1');

        expect(Object.keys(movementArr.keys).length).toBe(3);
        expect(movementArr.keys['m1']).toBe(true);
        expect(movementArr.keys['m2']).toBe(true);
        expect(movementArr.keys['m3']).toBe(true);
      });

      it('inserts new movement at beginning correctly', () => {
        const initialItems = [{
          key: 'm1',
          date: '2015-12-21',
          time: '14:30',
        }, {
          key: 'm2',
          date: '2015-12-24',
          time: '08:30',
        }];

        const movementArr = new ItemsArray(initialItems, compareDescending);
        const inserted = movementArr.insert({
          key: 'm3',
          date: '2015-12-25',
          time: '10:15',
        });

        expect(inserted).toBe(true);

        expect(movementArr.array.length).toBe(3);
        expect(movementArr.array[0].key).toBe('m3');
        expect(movementArr.array[1].key).toBe('m2');
        expect(movementArr.array[2].key).toBe('m1');

        expect(Object.keys(movementArr.keys).length).toBe(3);
        expect(movementArr.keys['m1']).toBe(true);
        expect(movementArr.keys['m2']).toBe(true);
        expect(movementArr.keys['m3']).toBe(true);
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

        const movementArr = new ItemsArray(initialItems, compareDescending);
        const inserted = movementArr.insert({
          key: 'm2',
          date: '2015-12-24',
          time: '08:30',
        });

        expect(inserted).toBe(false);

        expect(movementArr.array.length).toBe(2);
        expect(movementArr.array[0].key).toBe('m2');
        expect(movementArr.array[1].key).toBe('m1');

        expect(Object.keys(movementArr.keys).length).toBe(2);
        expect(movementArr.keys['m1']).toBe(true);
        expect(movementArr.keys['m2']).toBe(true);
      });

      it('throws error if key is missing', () => {
        const movement = {
        };

        const movementArr = new ItemsArray([], compareDescending);
        expect(() => movementArr.insert(movement)).toThrow('Property "key" is missing');
      });
    });
  });
});
