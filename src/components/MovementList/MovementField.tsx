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

const Value = styled.div<{ $hasValue?: boolean }>`
  width: 50%;
  margin-left: 50%;
  overflow-wrap: break-word;
  ${props => !props.$hasValue && 'opacity: 0.5;'}
`;

class MovementField extends React.PureComponent<any, any> {

  render() {
    const props = this.props;

    return (
      <Wrapper>
        <Label>{props.label}</Label>
        <Value $hasValue={!!props.value}>{props.value == null ? props.defaultValue : props.value}</Value>
      </Wrapper>
    )
  }
}

(MovementField as any).propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.any,
  defaultValue: PropTypes.any,
};

(MovementField as any).defaultProps = {
  defaultValue: 'k.A.'
};

export default MovementField;
