import expect from 'expect';
import messages from '../../../src/modules/messages/reducer';
import * as actions from '../../../src/modules/messages/actions';
import ImmutableItemsArray from '../../../src/util/ImmutableItemsArray';
import SS from '../../FakeFirebaseSnapshot';

const INITIAL_STATE = {
  data: new ImmutableItemsArray(),
  loading: false,
  selected: null,
};

describe('messages reducer', () => {
  it('should handle initial state', () => {
    expect(
      messages(undefined, {})
    ).toEqual(INITIAL_STATE);
  });

  describe('SET_MESSAGES_LOADING', () => {
    it('should set loading flag', () => {
      expect(
        messages({
          data: new ImmutableItemsArray([{
            key: 'msg1',
            text: 'text 1',
          }]),
          loading: false,
          selected: null,
        }, actions.setMessagesLoading())
      ).toEqual({
        data: new ImmutableItemsArray([{
          key: 'msg1',
          text: 'text 1',
        }]),
        loading: true,
        selected: null,
      });
    });
  });

  describe('MESSAGES_LOADED', () => {
    it('should add to initial state', () => {
      expect(
        messages({
          data: new ImmutableItemsArray(),
          loading: true,
          selected: null,
        }, actions.messagesLoaded(
          new SS('messages', [
            new SS('msg1', {
              text: 'text 1',
            }), new SS('msg2', {
              text: 'text 2',
            }),
          ])
        ))
      ).toEqual({
        data: new ImmutableItemsArray([{
          key: 'msg2',
          text: 'text 2',
        }, {
          key: 'msg1',
          text: 'text 1',
        }]),
        loading: false,
        selected: null,
      });
    });

    it('should override existing data', () => {
      expect(
        messages({
          data: new ImmutableItemsArray([{
            key: 'anymsg',
            text: 'anything',
          }]),
          loading: true,
          selected: null,
        }, actions.messagesLoaded(
          new SS('messages', [
            new SS('msg1', {
              text: 'text 1',
            }), new SS('msg2', {
              text: 'text 2',
            }),
          ])
        ))
      ).toEqual({
        data: new ImmutableItemsArray([{
          key: 'msg2',
          text: 'text 2',
        }, {
          key: 'msg1',
          text: 'text 1',
        }]),
        loading: false,
        selected: null,
      });
    });
  });

  describe('SELECT_MESSAGE', () => {
    it('should set selected message', () => {
      expect(
        messages({
          data: new ImmutableItemsArray([{
            key: 'msg1',
            text: 'text 1',
          }]),
          loading: false,
          selected: null,
        }, actions.selectMessage('msg1'))
      ).toEqual({
        data: new ImmutableItemsArray([{
          key: 'msg1',
          text: 'text 1',
        }]),
        loading: false,
        selected: 'msg1',
      });
    });

    it('should unset selected message', () => {
      expect(
        messages({
          data: new ImmutableItemsArray([{
            key: 'msg1',
            text: 'text 1',
          }]),
          loading: false,
          selected: null,
        }, actions.selectMessage(null))
      ).toEqual({
        data: new ImmutableItemsArray([{
          key: 'msg1',
          text: 'text 1',
        }]),
        loading: false,
        selected: null,
      });
    });
  });
});
