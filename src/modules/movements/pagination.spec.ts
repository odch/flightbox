import {getPagination, LIMIT} from './pagination';

describe('modules', () => {
  describe('movements', () => {
    describe('pagination', () => {
      describe('getPagination', () => {
        it('should return initial pagination if array empty', () => {
          const pagination = getPagination([]);

          expect(pagination).toEqual({
            start: undefined,
            limit: LIMIT
          });
        });

        it('should throw an error if negativeTimestamp not set', () => {
          const emptyItem = {};

          expect(() => getPagination([emptyItem]))
            .toThrow('Date "undefined" does not match pattern YYYY-MM-DD');
        });

        it('should return the next page if array not empty', () => {
          const arr = [
            {
              date: '2017-04-11',
              time: '15:00'
            },
            {
              date: '2017-04-11',
              time: '14:00'
            }
          ];
          const pagination = getPagination(arr);

          expect(pagination).toEqual({
            start: -1491912000000,
            // limit 1 higher than LIMIT, because start item is already loaded and will be thrown away
            limit: LIMIT + 1
          });
        });

        it('should increase limit if multiple "start" items with same date', () => {
          const arr = [
            {
              date: '2017-04-11',
              time: '15:00'
            },
            // oldest 3 items have all the same date
            {
              date: '2017-04-11',
              time: '14:00'
            },
            {
              date: '2017-04-11',
              time: '14:00'
            },
            {
              date: '2017-04-11',
              time: '14:00'
            }
          ];
          const pagination = getPagination(arr);

          expect(pagination).toEqual({
            start: -1491912000000,
            // limit 3 higher than LIMIT, because the 3 start items are already loaded and will be thrown away
            limit: LIMIT + 3
          });
        });
      });
    });
  });
});
