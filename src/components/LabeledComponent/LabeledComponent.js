import React, { PropTypes, Component } from 'react';
import classNames from 'classnames';
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
  }

  render() {
    return (
      <Wrapper className={classNames('LabeledComponent', this.props.className)} onFocus={this.onFocus.bind(this)} onBlur={this.onBlur.bind(this)}>
        <Label>{this.props.label}</Label>
        {this.props.validationError && <ValidationMessage error={this.props.validationError}/>}
        <ComponentContainer>{this.props.component}</ComponentContainer>
        {this.state.tooltipVisible && this.props.tooltip && <Tooltip>{this.props.tooltip}</Tooltip>}
      </Wrapper>
    );
  }

  onFocus() {
    this.setState({
      tooltipVisible: true,
    });
  }

  onBlur() {
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
