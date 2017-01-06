import React, {PropTypes, Component} from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
  padding: 10px 20px 0 20px;
  overflow: hidden;
`;

const Button = styled.button`
  color: #000;
  text-decoration: none;
  cursor: pointer;
  user-select: none;
  border: none;
  background: none;
  font-size: 1.5em;
`;

const Next = styled(Button)`
  color: ${props => props.theme.colors.main};
  float: right;
  margin-left: 20px;
`;

const Prev = styled(Button)`
`;

const WizardNavigation = props => (
  <Wrapper>
    {props.previousVisible && <Prev type="button" onMouseDown={props.previousStep} tabIndex="-1">Zurück</Prev>}
    {props.nextVisible && <Next type="submit" onMouseDown={props.nextStep} tabIndex="-1">{props.nextLabel || 'Weiter'}</Next>}
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
