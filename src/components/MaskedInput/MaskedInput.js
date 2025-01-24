import React, {Component} from 'react'
import {maskEmail, maskPhone, maskText} from '../../util/masking'
import MaterialIcon from '../MaterialIcon'
import Input from '../Input'
import styled from 'styled-components'
import Tooltip from '../LabeledComponent/Tooltip'

const StyledMaskedComponent = styled.div`
  padding: 1px 2px;
  line-height: normal;
  border-bottom: 1px solid #000;
  position: relative;
`

const MaskedContent = styled.span`
  opacity: 0.5;
`

const ClearButton = styled.button`
  padding: 0;
  border: none;
  background-color: transparent;
  cursor: pointer;
  position: absolute;
  top: 5px;
  right: 5px;
`;

class MaskedInput extends Component {

  constructor(props) {
    super(props)

    this.state = {
      tooltipVisible: false
    }

    this.refInputDom = this.refInputDom.bind(this)
    this.handleClear = this.handleClear.bind(this)
    this.handleMouseEnter = this.handleMouseEnter.bind(this)
    this.handleMouseLeave = this.handleMouseLeave.bind(this)
  }

  refInputDom(input) {
    this.inputRef = input
  }

  handleClear() {
    this.props.input.onChange(null)
    window.requestAnimationFrame(() => {
      if (this.inputRef) {
        this.inputRef.focus()
      }
    });
  }

  handleMouseEnter() {
    this.setState({
      tooltipVisible: true
    })
  }

  handleMouseLeave() {
    this.setState({
      tooltipVisible: false
    })
  }

  render() {
    if (this.props.input.value && !this.props.meta.active) {
      return (
        <StyledMaskedComponent onMouseEnter={this.handleMouseEnter} onMouseLeave={this.handleMouseLeave}>
          <MaskedContent>{
            this.props.type === 'email'
              ? maskEmail(this.props.input.value)
              : this.props.type === 'tel'
                ? maskPhone(this.props.input.value)
                : maskText(this.props.input.value)
          }</MaskedContent>
          <ClearButton onClick={this.handleClear} type="button">
            <MaterialIcon icon="clear"/>
          </ClearButton>
          {this.state.tooltipVisible && <Tooltip>Um dieses Feld zu bearbeiten, leeren Sie es und setzen Sie anschliessend den gewünschten Wert.</Tooltip>}
        </StyledMaskedComponent>
      )
    }

    return (
      <Input
        {...this.props.input}
        name={this.props.name}
        type={this.props.type}
        readOnly={this.props.readOnly}
        data-cy={this.props.input.name}
        innerRef={this.refInputDom}
      />
    );
  }
}

export default MaskedInput;
