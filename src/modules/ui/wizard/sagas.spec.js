import expect from 'expect';
import { put } from 'redux-saga/effects';
import { push } from 'react-router-redux';
import * as actions from './actions';
import * as sagas from './sagas';
import { saveDepartureSuccess } from '../../movements/departures/actions';

describe('wizard sagas', () => {
  describe('setCommitted', () => {
    it('should set committed', () => {
      const key = 'testkey';
      const values = {
        immatriculation: 'HBKOF',
      };
      const saveDepartureSuccessAction = saveDepartureSuccess(key, values);

      const generator = sagas.setCommitted(saveDepartureSuccessAction);

      expect(generator.next().value).toEqual(put(actions.setCommitted(key, values)));
      expect(generator.next().done).toEqual(true);
    });
  });

  describe('finish', () => {
    it('should redirect and reset wizard', () => {
      const generator = sagas.finish();

      expect(generator.next().value).toEqual(put(push('/')));
      expect(generator.next().value).toEqual(put(actions.reset()));
      expect(generator.next().done).toEqual(true);
    });
  });
});
