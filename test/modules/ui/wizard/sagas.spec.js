import expect from 'expect';
import { put } from 'redux-saga/effects';
import { reset as resetForm } from 'redux-form';
import { push } from 'react-router-redux';
import * as actions from '../../../../src/modules/ui/wizard/actions';
import * as sagas from '../../../../src/modules/ui/wizard/sagas';

describe('wizard sagas', () => {
  describe('setCommitted', () => {
    it('should set committed', () => {
      const generator = sagas.setCommitted();

      expect(generator.next().value).toEqual(put(actions.setCommitted()));
      expect(generator.next().done).toEqual(true);
    });
  });

  describe('finish', () => {
    it('should redirect and reset wizard', () => {
      const generator = sagas.finish();

      expect(generator.next().value).toEqual(put(push('/')));
      expect(generator.next().value).toEqual(put(actions.reset()));
      expect(generator.next().value).toEqual(put(resetForm('wizard')));
      expect(generator.next().done).toEqual(true);
    });
  });
});
