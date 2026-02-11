import {put} from 'redux-saga/effects';
import * as actions from './actions';
import * as sagas from './sagas';
import {saveMovementSuccess} from '../../movements/actions';
import {history} from '../../../history';

jest.mock('../../../history', () => ({
  history: {
    push: jest.fn(),
  },
}));

describe('modules', () => {
  describe('ui', () => {
    describe('wizard', () => {
      describe('sagas', () => {
        describe('setCommitted', () => {
          it('should set committed', () => {
            const key = 'testkey';
            const values = {
              immatriculation: 'HBKOF',
            };
            const saveMovementSuccessAction = saveMovementSuccess(key, values);

            const generator = sagas.setCommitted(saveMovementSuccessAction);

            expect(generator.next().value).toEqual(put(actions.setCommitted(key, values)));
            expect(generator.next().done).toEqual(true);
          });
        });

        describe('finish', () => {
          it('should redirect and reset wizard', () => {
            const generator = sagas.finish();

            expect(generator.next().value).toEqual(put(actions.reset()));
            expect(generator.next().done).toEqual(true);

            expect(history.push).toHaveBeenCalledWith('/');
          });
        });
      });
    });
  });
});
