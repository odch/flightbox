import expect from 'expect';
import { call, put, select } from 'redux-saga/effects';
import * as actions from '../../../src/modules/messages/actions';
import * as sagas from '../../../src/modules/messages/sagas';
import FakeFirebaseSnapshot from '../../FakeFirebaseSnapshot';

describe('messages sagas', () => {
  describe('loadMessages', () => {
    it('should return if currently loading', () => {
      const generator = sagas.loadMessages();

      expect(generator.next().value).toEqual(select(sagas.messagesSelector));
      expect(generator.next({ loading: true }).done).toEqual(true);
    });

    it('should load messages', () => {
      const generator = sagas.loadMessages();

      expect(generator.next().value).toEqual(select(sagas.messagesSelector));
      expect(generator.next({ loading: false }).value).toEqual(put(actions.setMessagesLoading()));
      expect(generator.next().value).toEqual(call(sagas.loadAll));

      const snapshot = new FakeFirebaseSnapshot('messages', []);
      expect(generator.next(snapshot).value).toEqual(put(actions.messagesLoaded(snapshot)));

      expect(generator.next().done).toEqual(true);
    });
  });
});