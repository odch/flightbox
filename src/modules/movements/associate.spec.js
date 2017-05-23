import expect from 'expect';
import ImmutableItemsArray from '../../util/ImmutableItemsArray';
import {compareDescending} from '../../util/movements';
import associate from './associate';

describe('modules', () => {
  describe('movements', () => {
    describe('associate', () => {
      it('should return same movements object if no movements', () => {
        const movements = new ImmutableItemsArray([]);
        const associated = associate(movements, compareDescending);
        expect(associated).toBe(movements);
      });

      it('should set empty associations for single movement', () => {
        const associated = associate(new ImmutableItemsArray([{
          key: 'dep1',
          immatriculation: 'HBABC'
        }]), compareDescending);

        expect(associated.array).toEqual([{
          key: 'dep1',
          immatriculation: 'HBABC',
          associations: {
            preceding: null,
            subsequent: null
          }
        }]);
      });

      it('should associate two movements of certain aircraft', () => {
        const associated = associate(new ImmutableItemsArray([{
          key: 'arr1',
          immatriculation: 'HBABC',
          date: '2017-05-21',
          time: '14:00'
        }, {
          key: 'dep1',
          immatriculation: 'HBABC',
          date: '2017-05-21',
          time: '13:30'
        }]), compareDescending);

        expect(associated.array).toEqual([{
          key: 'arr1',
          immatriculation: 'HBABC',
          date: '2017-05-21',
          time: '14:00',
          associations: {
            preceding: 'dep1',
            subsequent: null
          }
        }, {
          key: 'dep1',
          immatriculation: 'HBABC',
          date: '2017-05-21',
          time: '13:30',
          associations: {
            preceding: null,
            subsequent: 'arr1'
          }
        }]);
      });

      it('should associate movements of multiple aircrafts (grouped by aircraft)', () => {
        const associated = associate(new ImmutableItemsArray([{
          key: 'arr1',
          immatriculation: 'HBABC',
          date: '2017-05-21',
          time: '15:30'
        }, {
          key: 'arr2',
          immatriculation: 'HBERT',
          date: '2017-05-21',
          time: '15:00'
        }, {
          key: 'dep1',
          immatriculation: 'HBABC',
          date: '2017-05-21',
          time: '11:30'
        }, {
          key: 'dep2',
          immatriculation: 'HBERT',
          date: '2017-05-21',
          time: '10:30'
        }]), compareDescending);

        expect(associated.array).toEqual([{
          key: 'arr1',
          immatriculation: 'HBABC',
          date: '2017-05-21',
          time: '15:30',
          associations: {
            preceding: 'dep1',
            subsequent: null
          }
        }, {
          key: 'arr2',
          immatriculation: 'HBERT',
          date: '2017-05-21',
          time: '15:00',
          associations: {
            preceding: 'dep2',
            subsequent: null
          }
        }, {
          key: 'dep1',
          immatriculation: 'HBABC',
          date: '2017-05-21',
          time: '11:30',
          associations: {
            preceding: null,
            subsequent: 'arr1'
          }
        }, {
          key: 'dep2',
          immatriculation: 'HBERT',
          date: '2017-05-21',
          time: '10:30',
          associations: {
            preceding: null,
            subsequent: 'arr2'
          }
        }]);
      });

      it('should associate three movements of certain aircraft', () => {
        const associated = associate(new ImmutableItemsArray([{
          key: 'dep2',
          immatriculation: 'HBABC',
          date: '2017-05-21',
          time: '13:30'
        }, {
          key: 'arr1',
          immatriculation: 'HBABC',
          date: '2017-05-21',
          time: '12:00'
        }, {
          key: 'dep1',
          immatriculation: 'HBABC',
          date: '2017-05-21',
          time: '11:00'
        }]), compareDescending);

        expect(associated.array).toEqual([{
          key: 'dep2',
          immatriculation: 'HBABC',
          date: '2017-05-21',
          time: '13:30',
          associations: {
            preceding: 'arr1',
            subsequent: null
          }
        }, {
          key: 'arr1',
          immatriculation: 'HBABC',
          date: '2017-05-21',
          time: '12:00',
          associations: {
            preceding: 'dep1',
            subsequent: 'dep2'
          }
        }, {
          key: 'dep1',
          immatriculation: 'HBABC',
          date: '2017-05-21',
          time: '11:00',
          associations: {
            preceding: null,
            subsequent: 'arr1'
          }
        }]);
      });
    });
  });
});
