import React, {PropTypes, Component} from 'react';
import styled from 'styled-components';
import Button from '../Button';

const Wrapper = styled.div`
  padding: 10px 20px 10px 20px;
  overflow: hidden;
`;

const NextButton = styled(Button)`
  float: right;
  margin-left: 20px;
`;

const WizardNavigation = props => (
  <Wrapper>
    {props.previousVisible && (
      <Button
        type="button"
        label="Zurück"
        onClick={props.previousStep}
      />
    )}
    {props.nextVisible && (
      <NextButton
        type="submit"
        label={props.nextLabel || 'Weiter'}
        icon="navigate_next"
        onClick={props.nextStep}
        primary
      />
    )}
  </Wrapper>
);

WizardNavigation.propTypes = {
  previousStep: PropTypes.func,
  nextStep: PropTypes.func,
  nextLabel: PropTypes.string,
  nextVisible: PropTypes.bool,
  previousVisible: PropTypes.bool,
};

WizardNavigation.defaultProps = {
  nextVisible: true,
  previousVisible: true
};

export default WizardNavigation;
