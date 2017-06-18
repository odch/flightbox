import expect from 'expect';
import messages from './reducer';
import * as actions from './actions';
import ImmutableItemsArray from '../../util/ImmutableItemsArray';
import SS from '../../../test/FakeFirebaseSnapshot';

const INITIAL_STATE = {
  data: new ImmutableItemsArray(),
  loading: false,
};

describe('modules', () => {
  describe('users', () => {
    describe('reducer', () => {
      it('should handle initial state', () => {
        expect(
          messages(undefined, {})
        ).toEqual(INITIAL_STATE);
      });

      describe('SET_USERS_LOADING', () => {
        it('should set loading flag', () => {
          expect(
            messages({
              data: new ImmutableItemsArray([{
                memberNr: '23533',
              }]),
              loading: false,
            }, actions.setUsersLoading())
          ).toEqual({
            data: new ImmutableItemsArray([{
              memberNr: '23533',
            }]),
            loading: true,
          });
        });
      });

      describe('USERS_LOADED', () => {
        it('should add to initial state', () => {
          expect(
            messages({
              data: new ImmutableItemsArray(),
              loading: true,
            }, actions.usersLoaded(
              new SS('users', [
                new SS('user1', {
                  memberNr: '34903',
                }), new SS('user2', {
                  memberNr: '29343',
                }),
              ])
            ))
          ).toEqual({
            data: new ImmutableItemsArray([{
              memberNr: '29343',
            }, {
              memberNr: '34903',
            }]),
            loading: false,
          });
        });

        it('should override existing data', () => {
          expect(
            messages({
              data: new ImmutableItemsArray([{
                key: 'user3',
                memberNr: '32430',
              }]),
              loading: true,
            }, actions.usersLoaded(
              new SS('users', [
                new SS('user1', {
                  memberNr: '34903',
                }), new SS('user2', {
                  memberNr: '29343',
                }),
              ])
            ))
          ).toEqual({
            data: new ImmutableItemsArray([{
              memberNr: '29343',
            }, {
              memberNr: '34903',
            }]),
            loading: false,
          });
        });
      });
    });
  });
});
