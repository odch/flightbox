import expect from 'expect';
import { put } from 'redux-saga/effects';
import { push } from 'react-router-redux';
import * as actions from '../../../../src/modules/ui/wizard/actions';
import * as sagas from '../../../../src/modules/ui/wizard/sagas';
import { saveDepartureSuccess } from '../../../../src/modules/movements/departures/actions';

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
