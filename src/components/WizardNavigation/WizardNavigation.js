import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import Button from '../Button';

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

class WizardNavigation extends React.PureComponent {

  render() {
    const props = this.props;
    return (
      <Wrapper>
        {props.nextVisible && (
          <NextButton
            type="submit"
            label={props.nextLabel || 'Weiter'}
            icon="navigate_next"
            onClick={props.nextStep}
            dataCy="next-button"
            primary
          />
        )}
        {props.previousVisible && (
          <BackButton
            type="button"
            label="Zurück"
            onClick={props.previousStep}
          />
        )}
        {props.cancel && (
          <CancelButton
            type="button"
            label="Abbrechen"
            onClick={props.cancel}
          />
        )}
      </Wrapper>)
  }
}

WizardNavigation.propTypes = {
  previousStep: PropTypes.func,
  nextStep: PropTypes.func,
  nextLabel: PropTypes.string,
  nextVisible: PropTypes.bool,
  previousVisible: PropTypes.bool,
  cancel: PropTypes.func
};

WizardNavigation.defaultProps = {
  nextVisible: true,
  previousVisible: true
};

export default WizardNavigation;
