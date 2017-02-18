import React, { PropTypes, Component } from 'react';
import Label from './Label';
import ComponentContainer from './ComponentContainer';
import Tooltip from './Tooltip';
import ValidationMessage from './ValidationMessage';
import Wrapper from './Wrapper';

class LabeledComponent extends Component {

  constructor(props) {
    super(props);
    this.state = {
      tooltipVisible: false,
    };
    this.handleFocus = this.handleFocus.bind(this);
    this.handleBlur = this.handleBlur.bind(this);
  }

  render() {
    return (
      <Wrapper className={this.props.className} onFocus={this.handleFocus} onBlur={this.handleBlur}>
        <Label>{this.props.label}</Label>
        {this.props.validationError && <ValidationMessage error={this.props.validationError}/>}
        <ComponentContainer>{this.props.component}</ComponentContainer>
        {this.state.tooltipVisible && this.props.tooltip && <Tooltip>{this.props.tooltip}</Tooltip>}
      </Wrapper>
    );
  }

  handleFocus() {
    this.setState({
      tooltipVisible: true,
    });
  }

  handleBlur() {
    this.setState({
      tooltipVisible: false,
    });
  }
}

LabeledComponent.propTypes = {
  label: PropTypes.string.isRequired,
  component: PropTypes.element.isRequired,
  className: PropTypes.string,
  validationError: PropTypes.string,
  tooltip: PropTypes.string,
};

export default LabeledComponent;
