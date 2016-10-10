import expect from 'expect';
import { select, put, call } from 'redux-saga/effects';
import { initialize, getFormValues } from 'redux-form';
import dates from '../../../src/core/dates.js';
import * as actions from '../../../src/modules/departures/actions';
import * as sagas from '../../../src/modules/departures/sagas';

describe('departues sagas', () => {
  describe('initNewDeparture', () => {
    it('should init new departure', () => {
      const generator = sagas.initNewDeparture();

      expect(generator.next().value).toEqual(put(initialize('wizard', {
        date: dates.localDate(),
        time: dates.localTimeRounded(15, 'up'),
      })));

      expect(generator.next().done).toEqual(true);
    });
  });

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
