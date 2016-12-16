import expect from 'expect';
import { select, put, call } from 'redux-saga/effects';
import { initialize, getFormValues, destroy } from 'redux-form';
import dates from '../../../util/dates';
import * as actions from './actions';
import * as sagas from './sagas';
import * as remote from './remote';

describe('modules', () => {
  describe('movements', () => {
    describe('shared', () => {
      describe('sagas', () => {
        describe('initNewMovement', () => {
          it('should init new departure', () => {
            const loadInitialValues = () => undefined;

            const generator = sagas.initNewMovement(loadInitialValues, 'testarg1', 'testarg2');

            expect(generator.next().value).toEqual(put(actions.startInitializeWizard()));
            expect(generator.next().value).toEqual(put(destroy('wizard')));
            expect(generator.next().value).toEqual(call(loadInitialValues, 'testarg1', 'testarg2'));

            const initialValues = {
              date: dates.localDate(),
              time: dates.localTimeRounded(15, 'up'),
            };

            expect(generator.next(initialValues).value).toEqual(put(initialize('wizard', initialValues)));

            expect(generator.next().value).toEqual(put(actions.wizardInitialized()));

            expect(generator.next().done).toEqual(true);
          });
        });

        describe('saveMovement', () => {
          it('should save departure', () => {
            const successAction = () => ({
              type: 'TEST_SUCCESS_ACTION',
            });

            const generator = sagas.saveMovement('/departures', successAction);

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

            expect(generator.next(formValues).value).toEqual(call(remote.saveMovement, '/departures', undefined, formValuesForFirebase));

            const key = 'new-departure-key';

            expect(generator.next(key).value).toEqual(put(successAction()));

            expect(generator.next().done).toEqual(true);
          });
        });
      });
    });
  });
});
