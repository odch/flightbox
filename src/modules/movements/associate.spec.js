import ImmutableItemsArray from '../../util/ImmutableItemsArray';
import getAssociations from './associate';

describe('modules', () => {
  describe('movements', () => {
    describe('associate', () => {
      const homeBaseAicrafts = new Set(['HBABC', 'HBERT']);

      it('should return same movements object if no movements', () => {
        const homeBaseAicrafts = new Set();
        const movements = new ImmutableItemsArray([]);
        const associations = getAssociations(movements.array, homeBaseAicrafts);
        expect(associations).toEqual({});
      });

      it('should return undefined for single movement', () => {
        const movements = new ImmutableItemsArray([{
          key: 'dep1',
          immatriculation: 'HBABC',
          type: 'departure'
        }]);

        const associations = getAssociations(movements.array, homeBaseAicrafts);

        expect(associations).toEqual({
          dep1: undefined
        });
      });

      it('should associate two movements of certain aircraft', () => {
        const movements = new ImmutableItemsArray([{
          key: 'arr1',
          immatriculation: 'HBABC',
          date: '2017-05-21',
          time: '14:00',
          type: 'arrival'
        }, {
          key: 'dep1',
          immatriculation: 'HBABC',
          date: '2017-05-21',
          time: '13:30',
          type: 'departure'
        }]);

        const associations = getAssociations(movements.array, homeBaseAicrafts);

        expect(associations).toEqual({
          arr1: {
            key: 'dep1',
            immatriculation: 'HBABC',
            date: '2017-05-21',
            time: '13:30',
            type: 'departure'
          },
          dep1: {
            key: 'arr1',
            immatriculation: 'HBABC',
            date: '2017-05-21',
            time: '14:00',
            type: 'arrival'
          }
        });
      });

      it('should associate movements of multiple aircrafts (grouped by aircraft)', () => {
        const movements = new ImmutableItemsArray([{
          key: 'arr1',
          immatriculation: 'HBABC',
          date: '2017-05-21',
          time: '15:30',
          type: 'arrival'
        }, {
          key: 'arr2',
          immatriculation: 'HBERT',
          date: '2017-05-21',
          time: '15:00',
          type: 'arrival'
        }, {
          key: 'dep1',
          immatriculation: 'HBABC',
          date: '2017-05-21',
          time: '11:30',
          type: 'departure'
        }, {
          key: 'dep2',
          immatriculation: 'HBERT',
          date: '2017-05-21',
          time: '10:30',
          type: 'departure'
        }]);

        const associations = getAssociations(movements.array, homeBaseAicrafts);

        expect(associations).toEqual({
          arr1: {
            key: 'dep1',
            immatriculation: 'HBABC',
            date: '2017-05-21',
            time: '11:30',
            type: 'departure'
          },
          arr2: {
            key: 'dep2',
            immatriculation: 'HBERT',
            date: '2017-05-21',
            time: '10:30',
            type: 'departure'
          },
          dep1: {
            key: 'arr1',
            immatriculation: 'HBABC',
            date: '2017-05-21',
            time: '15:30',
            type: 'arrival'
          },
          dep2: {
            key: 'arr2',
            immatriculation: 'HBERT',
            date: '2017-05-21',
            time: '15:00',
            type: 'arrival'
          }
        });
      });

      it('should associate three movements of certain aircraft', () => {
        const movements = new ImmutableItemsArray([{
          key: 'dep2',
          immatriculation: 'HBABC',
          date: '2017-05-21',
          time: '13:30',
          type: 'departure'
        }, {
          key: 'arr1',
          immatriculation: 'HBABC',
          date: '2017-05-21',
          time: '12:00',
          type: 'arrival'
        }, {
          key: 'dep1',
          immatriculation: 'HBABC',
          date: '2017-05-21',
          time: '11:00',
          type: 'departure'
        }]);

        const associations = getAssociations(movements.array, homeBaseAicrafts);

        expect(associations).toEqual({
          dep2: undefined,
          arr1: {
            key: 'dep1',
            immatriculation: 'HBABC',
            date: '2017-05-21',
            time: '11:00',
            type: 'departure'
          },
          dep1: {
            key: 'arr1',
            immatriculation: 'HBABC',
            date: '2017-05-21',
            time: '12:00',
            type: 'arrival'
          }
        });
      });

      it('should not associate circuit movements with non circuit movement', () => {
        const movements = new ImmutableItemsArray([{
          key: 'arr1',
          immatriculation: 'HBABC',
          date: '2017-05-21',
          time: '12:00',
          type: 'arrival',
          arrivalRoute: 'circuits'
        }, {
          key: 'dep1',
          immatriculation: 'HBABC',
          date: '2017-05-21',
          time: '11:00',
          type: 'departure',
          departureRoute: 'south'
        }]);

        const associations = getAssociations(movements.array, homeBaseAicrafts);

        expect(associations).toEqual({
          arr1: undefined,
          dep1: undefined
        });
      });

      it('should associate circuit movement with circuit movement', () => {
        const movements = new ImmutableItemsArray([{
          key: 'arr1',
          immatriculation: 'HBABC',
          date: '2017-05-21',
          time: '12:00',
          type: 'arrival',
          arrivalRoute: 'circuits'
        }, {
          key: 'dep1',
          immatriculation: 'HBABC',
          date: '2017-05-21',
          time: '11:00',
          type: 'departure',
          departureRoute: 'circuits'
        }]);

        const associations = getAssociations(movements.array, homeBaseAicrafts);

        expect(associations).toEqual({
          arr1: {
            key: 'dep1',
            immatriculation: 'HBABC',
            date: '2017-05-21',
            time: '11:00',
            type: 'departure',
            departureRoute: 'circuits'
          },
          dep1: {
            key: 'arr1',
            immatriculation: 'HBABC',
            date: '2017-05-21',
            time: '12:00',
            type: 'arrival',
            arrivalRoute: 'circuits'
          }
        });
      });

      it('should associate circuit movement with circuit movement and non-circuit with non-cuircuit', () => {
        const movements = new ImmutableItemsArray([{
          key: 'dep2',
          immatriculation: 'HBEXT',
          date: '2017-05-21',
          time: '14:00',
          type: 'departure',
          departureRoute: 'south'
        }, {
          key: 'arr2',
          immatriculation: 'HBEXT',
          date: '2017-05-21',
          time: '13:00',
          type: 'arrival',
          arrivalRoute: 'circuits'
        }, {
          key: 'dep1',
          immatriculation: 'HBEXT',
          date: '2017-05-21',
          time: '12:00',
          type: 'departure',
          departureRoute: 'circuits'
        }, {
          key: 'arr1',
          immatriculation: 'HBEXT',
          date: '2017-05-21',
          time: '11:00',
          type: 'arrival',
          arrivalRoute: 'south'
        }]);

        const associations = getAssociations(movements.array, homeBaseAicrafts);

        expect(associations).toEqual({
          dep2: {
            key: 'arr1',
            immatriculation: 'HBEXT',
            date: '2017-05-21',
            time: '11:00',
            type: 'arrival',
            arrivalRoute: 'south'
          },
          arr1: {
            key: 'dep2',
            immatriculation: 'HBEXT',
            date: '2017-05-21',
            time: '14:00',
            type: 'departure',
            departureRoute: 'south'
          },
          arr2: {
            key: 'dep1',
            immatriculation: 'HBEXT',
            date: '2017-05-21',
            time: '12:00',
            type: 'departure',
            departureRoute: 'circuits'
          },
          dep1: {
            key: 'arr2',
            immatriculation: 'HBEXT',
            date: '2017-05-21',
            time: '13:00',
            type: 'arrival',
            arrivalRoute: 'circuits'
          }
        });
      });
    });
  });
});
