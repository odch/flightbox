import reducer from './reducer';
import * as actions from './actions';
import ImmutableItemsArray from '../../util/ImmutableItemsArray';
import SS from '../../../test/FakeFirebaseSnapshot';

const INITIAL_STATE = {
  data: new ImmutableItemsArray(),
  loading: false,
  selected: null,
};

describe('modules', () => {
  describe('aircrafts', () => {
    describe('reducer', () => {
      it('should handle initial state', () => {
        expect(
          reducer(undefined, {})
        ).toEqual(INITIAL_STATE);
      });

      describe('SET_AIRCRAFTS_LOADING', () => {
        it('should set loading flag', () => {
          expect(
            reducer({
              data: new ImmutableItemsArray([{
                key: 'HB-KOF',
                type: 'airplane',
              }]),
              loading: false,
              selected: null,
            }, actions.setAircraftsLoading())
          ).toEqual({
            data: new ImmutableItemsArray([{
              key: 'HB-KOF',
              type: 'airplane',
            }]),
            loading: true,
            selected: null,
          });
        });
      });

      describe('AIRCRAFTS_LOADED', () => {
        it('should load aircrafts into initial state', () => {
          expect(
            reducer({
              data: new ImmutableItemsArray(),
              loading: true,
              selected: null,
            }, actions.aircraftsLoaded(
              new SS('aircrafts', [
                new SS('HB-KOF', {
                  type: 'airplane',
                }),
                new SS('HB-PBY', {
                  type: 'glider',
                }),
              ])
            ))
          ).toEqual({
            data: new ImmutableItemsArray([{
              key: 'HB-PBY',
              type: 'glider',
            }, {
              key: 'HB-KOF',
              type: 'airplane',
            }]),
            loading: false,
            selected: null,
          });
        });

        it('should override existing data', () => {
          expect(
            reducer({
              data: new ImmutableItemsArray([{
                key: 'HB-OLD',
                type: 'airplane',
              }]),
              loading: true,
              selected: null,
            }, actions.aircraftsLoaded(
              new SS('aircrafts', [
                new SS('HB-KOF', {
                  type: 'airplane',
                }),
              ])
            ))
          ).toEqual({
            data: new ImmutableItemsArray([{
              key: 'HB-KOF',
              type: 'airplane',
            }]),
            loading: false,
            selected: null,
          });
        });

        it('should handle empty snapshot', () => {
          expect(
            reducer({
              data: new ImmutableItemsArray([{
                key: 'HB-KOF',
                type: 'airplane',
              }]),
              loading: true,
              selected: null,
            }, actions.aircraftsLoaded(
              new SS('aircrafts', [])
            ))
          ).toEqual({
            data: new ImmutableItemsArray([]),
            loading: false,
            selected: null,
          });
        });
      });
    });
  });
});
