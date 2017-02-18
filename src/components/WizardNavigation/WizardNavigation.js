import React, {PropTypes} from 'react';
import styled from 'styled-components';
import Button from '../Button';

const Wrapper = styled.div`
  padding: 10px 20px 10px 20px;
  overflow: hidden;
`;

const BackButton = styled(Button)`
  float: right;
`;

const NextButton = styled(Button)`
  float: right;
  margin-left: 20px;
`;

class WizardNavigation extends React.PureComponent {

  render() {
    const props = this.props;
    return (
      <Wrapper>
        {props.cancel && (
          <Button
            type="button"
            label="Abbrechen"
            onClick={props.cancel}
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
        {props.previousVisible && (
          <BackButton
            type="button"
            label="Zurück"
            onClick={props.previousStep}
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
