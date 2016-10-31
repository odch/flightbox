import expect from 'expect';
import wizard from '../../../../src/modules/ui/wizard/reducer';
import * as actions from '../../../../src/modules/ui/wizard/actions';

const INITIAL_STATE = {
  page: 1,
  showCommitRequirementsDialog: false,
  committed: false,
  values: null,
};

describe('wizard reducer', () => {
  it('should handle initial state', () => {
    expect(
      wizard(undefined, {})
    ).toEqual(INITIAL_STATE);
  });

  describe('WIZARD_NEXT_PAGE', () => {
    it('should set next page', () => {
      expect(
        wizard({
          page: 2,
        }, actions.nextPage())
      ).toEqual({
        page: 3,
      });
    });
  });

  describe('WIZARD_PREVIOUS_PAGE', () => {
    it('should set previous page', () => {
      expect(
        wizard({
          page: 3,
        }, actions.previousPage())
      ).toEqual({
        page: 2,
      });
    });

    it('should stop at first page', () => {
      expect(
        wizard({
          page: 1,
        }, actions.previousPage())
      ).toEqual({
        page: 1,
      });
    });
  });

  describe('WIZARD_RESET', () => {
    it('should reset wizard', () => {
      expect(
        wizard({
          page: 3,
        }, actions.reset())
      ).toEqual(INITIAL_STATE);
    });
  });

  describe('WIZARD_SHOW_COMMIT_REQUIREMENTS_DIALOG', () => {
    it('should show requirements dialog', () => {
      expect(
        wizard({
          showCommitRequirementsDialog: false,
        }, actions.showCommitRequirementsDialog())
      ).toEqual({
        showCommitRequirementsDialog: true,
      });
    });
  });

  describe('WIZARD_HIDE_COMMIT_REQUIREMENTS_DIALOG', () => {
    it('should hide requirements dialog', () => {
      expect(
        wizard({
          showCommitRequirementsDialog: true,
        }, actions.hideCommitRequirementsDialog())
      ).toEqual({
        showCommitRequirementsDialog: false,
      });
    });
  });

  describe('WIZARD_SET_COMMITTED', () => {
    it('should reset wizard', () => {
      const key = 'mykey';
      const values = {
        foo: 'bar',
      };

      expect(
        wizard({
          committed: false,
        }, actions.setCommitted(key, values))
      ).toEqual({
        committed: true,
        itemKey: key,
        values,
      });
    });
  });
});
