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
  describe('aerodromes', () => {
    describe('reducer', () => {
      it('should handle initial state', () => {
        expect(
          reducer(undefined, {})
        ).toEqual(INITIAL_STATE);
      });

      describe('SET_AERODROMES_LOADING', () => {
        it('should set loading flag', () => {
          expect(
            reducer({
              data: new ImmutableItemsArray([{
                key: 'lszt',
                name: 'Zollhaus',
              }]),
              loading: false,
              selected: null,
            }, actions.setAerodromesLoading())
          ).toEqual({
            data: new ImmutableItemsArray([{
              key: 'lszt',
              name: 'Zollhaus',
            }]),
            loading: true,
            selected: null,
          });
        });
      });

      describe('AERODROMES_LOADED', () => {
        it('should load aerodromes into initial state', () => {
          expect(
            reducer({
              data: new ImmutableItemsArray(),
              loading: true,
              selected: null,
            }, actions.aerodromesLoaded(
              new SS('aerodromes', [
                new SS('lszt', {
                  name: 'Zollhaus',
                }),
                new SS('lspv', {
                  name: 'Plaisir-Vendôme',
                }),
              ])
            ))
          ).toEqual({
            data: new ImmutableItemsArray([{
              key: 'lspv',
              name: 'Plaisir-Vendôme',
            }, {
              key: 'lszt',
              name: 'Zollhaus',
            }]),
            loading: false,
            selected: null,
          });
        });

        it('should override existing data', () => {
          expect(
            reducer({
              data: new ImmutableItemsArray([{
                key: 'old',
                name: 'Old Aerodrome',
              }]),
              loading: true,
              selected: null,
            }, actions.aerodromesLoaded(
              new SS('aerodromes', [
                new SS('lszt', {
                  name: 'Zollhaus',
                }),
              ])
            ))
          ).toEqual({
            data: new ImmutableItemsArray([{
              key: 'lszt',
              name: 'Zollhaus',
            }]),
            loading: false,
            selected: null,
          });
        });

        it('should handle empty snapshot', () => {
          expect(
            reducer({
              data: new ImmutableItemsArray([{
                key: 'lszt',
                name: 'Zollhaus',
              }]),
              loading: true,
              selected: null,
            }, actions.aerodromesLoaded(
              new SS('aerodromes', [])
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
