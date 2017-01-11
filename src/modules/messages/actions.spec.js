import expect from 'expect';
import * as actions from './actions';

describe('messages actions', () => {
  it('loadMessages should create LOAD_MESSAGES action', () => {
    expect(actions.loadMessages()).toEqual({
      type: actions.LOAD_MESSAGES,
    });
  });

  it('setMessagesLoading should create SET_MESSAGES_LOADING action', () => {
    expect(actions.setMessagesLoading()).toEqual({
      type: actions.SET_MESSAGES_LOADING,
    });
  });

  it('messagesLoaded should create MESSAGES_LOADED action', () => {
    const snapshot = {};
    expect(actions.messagesLoaded(snapshot)).toEqual({
      type: actions.MESSAGES_LOADED,
      payload: {
        snapshot,
      },
    });
  });

  it('selectMessage should create SELECT_MESSAGE action', () => {
    expect(actions.selectMessage('msgkey')).toEqual({
      type: actions.SELECT_MESSAGE,
      payload: {
        key: 'msgkey',
      },
    });
  });
});
