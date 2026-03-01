import { call, put, select } from 'redux-saga/effects';
import * as actions from './actions';
import * as sagas from './sagas';
import * as remote from './remote';
import FakeFirebaseSnapshot from '../../../test/FakeFirebaseSnapshot';

jest.mock('../../history', () => ({ history: { push: jest.fn() } }));

import { history } from '../../history';

describe('modules', () => {
  describe('messages', () => {
    describe('sagas', () => {
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
          expect(generator.next().value).toEqual(call(remote.loadAll));

          const snapshot = new FakeFirebaseSnapshot('messages', []);
          expect(generator.next(snapshot).value).toEqual(put(actions.messagesLoaded(snapshot)));

          expect(generator.next().done).toEqual(true);
        });
      });

      describe('saveMessage', () => {
        it('should save message successfully', () => {
          const values = { text: 'Hello World' };
          const action = actions.saveMessage(values);
          const generator = sagas.saveMessage(action);

          expect(generator.next().value).toEqual(call(remote.save, values));
          expect(generator.next().value).toEqual(put(actions.saveMessageSuccess()));
          expect(generator.next().done).toEqual(true);
        });

        it('should put failure action when save throws', () => {
          const values = { text: 'Hello World' };
          const action = actions.saveMessage(values);
          const generator = sagas.saveMessage(action);

          expect(generator.next().value).toEqual(call(remote.save, values));

          const error = new Error('save failed');
          expect(generator.throw(error).value).toEqual(put(actions.saveMessageFailure()));
          expect(generator.next().done).toEqual(true);
        });
      });

      describe('confirmSaveMessageSuccess', () => {
        it('should redirect to root and reset message form', () => {
          history.push.mockClear();

          const generator = sagas.confirmSaveMessageSuccess();

          expect(generator.next().value).toEqual(put(actions.resetMessageForm()));
          expect(generator.next().done).toEqual(true);

          expect(history.push).toHaveBeenCalledWith('/');
        });
      });
    });
  });
});
