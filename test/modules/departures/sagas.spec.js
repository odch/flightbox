import expect from 'expect';
import { select, put, call } from 'redux-saga/effects';
import { getFormValues } from 'redux-form';
import * as actions from '../../../src/modules/departures/actions';
import * as sagas from '../../../src/modules/departures/sagas';

describe('departues sagas', () => {
  describe('saveDeparture', () => {
    it('should save departure', () => {
      const generator = sagas.saveDeparture();

      expect(generator.next().value).toEqual(select(getFormValues('wizard')));

      const formValues = {
        immatriculation: 'HBABC',
        date: '2016-10-09',
        time: '16:00:00Z',
      };

      const formValuesForFirebase = {
        immatriculation: 'HBABC',
        dateTime: '2016-10-09T16:00:00.000Z',
        negativeTimestamp: -1476028800000,
      };

      expect(generator.next(formValues).value).toEqual(call(sagas.pushMovement, formValuesForFirebase));

      const key = 'new-departure-key';

      expect(generator.next(key).value).toEqual(put(actions.saveDepartureSuccess(key)));

      expect(generator.next().done).toEqual(true);
    });
  });
});
