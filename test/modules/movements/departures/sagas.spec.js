import expect from 'expect';
import { call } from 'redux-saga/effects';
import dates from '../../../../src/core/dates.js';
import * as actions from '../../../../src/modules/movements/departures/actions';
import * as departuresSagas from '../../../../src/modules/movements/departures/sagas';
import * as sharedSagas from '../../../../src/modules/movements/shared/sagas';

describe('modules', () => {
  describe('movements', () => {
    describe('departures', () => {
      describe('sagas', () => {
        describe('initNewDeparture', () => {
          it('should init new departure', () => {
            const generator = departuresSagas.initNewDeparture();

            expect(generator.next().value).toEqual(call(sharedSagas.initNewMovement, departuresSagas.getDefaultValues));

            expect(generator.next().done).toEqual(true);
          });
        });

        describe('getInitialValues', () => {
          const generator = departuresSagas.getDefaultValues();

          const initialValues = {
            date: dates.localDate(),
            time: dates.localTimeRounded(15, 'up'),
          };

          const next = generator.next();

          expect(next.value).toEqual(initialValues);
          expect(next.done).toEqual(true);
        });

        describe('saveDeparture', () => {
          it('should save departure', () => {
            const generator = departuresSagas.saveDeparture();

            expect(generator.next().value).toEqual(call(sharedSagas.saveMovement, '/departures', actions.saveDepartureSuccess));

            expect(generator.next().done).toEqual(true);
          });
        });
      });
    });
  });
});
