import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
  overflow: hidden;
  margin-bottom: 0.4em;
`;

const Label = styled.div`
  width: 50%;
  float: left;
  font-weight: bold;
`;

const Value = styled.div`
  width: 50%;
  margin-left: 50%;
`;

class MovementField extends React.PureComponent {

  render() {
    const props = this.props;

    return (
      <Wrapper>
        <Label>{props.label}</Label>
        <Value>{props.value == null ? props.defaultValue : props.value}</Value>
      </Wrapper>
    )
  }
}

MovementField.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.any,
  defaultValue: PropTypes.any,
};

MovementField.defaultProps = {
  defaultValue: 'k.A.'
};

export default MovementField;
