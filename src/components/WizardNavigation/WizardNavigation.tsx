import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import Button from '../Button';
import { useTranslation } from 'react-i18next';

const Wrapper = styled.div`
  padding: 10px 20px 10px 20px;
  overflow: hidden;
`;

const WizardButton = styled(Button)`
  @media(max-width: 600px) {
    width: 100%;
    margin-bottom: 1em;
  }
`;

const BackButton = styled(WizardButton)`
  float: right;
`;

export const NextButton = styled(WizardButton)`
  float: right;
  margin-left: 20px;
`;

export const CancelButton = styled(WizardButton)`
  @media(max-width: 600px) {
    margin-top: 1.5em;
  }
`;

const WizardNavigation = ({
  previousStep,
  nextStep,
  nextLabel,
  nextVisible = true,
  previousVisible = true,
  cancel
}: any) => {
  const { t } = useTranslation();
  return (
    <Wrapper>
      {nextVisible && (
        <NextButton
          type="submit"
          label={nextLabel || t('wizard.next')}
          icon="navigate_next"
          onClick={nextStep}
          dataCy="next-button"
          primary
        />
      )}
      {previousVisible && (
        <BackButton
          type="button"
          label={t('wizard.back')}
          onClick={previousStep}
        />
      )}
      {cancel && (
        <CancelButton
          type="button"
          label={t('wizard.cancel')}
          onClick={cancel}
        />
      )}
    </Wrapper>
  );
};

WizardNavigation.propTypes = {
  previousStep: PropTypes.func,
  nextStep: PropTypes.func,
  nextLabel: PropTypes.string,
  nextVisible: PropTypes.bool,
  previousVisible: PropTypes.bool,
  cancel: PropTypes.func
};

export default WizardNavigation;
