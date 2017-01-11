import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.fieldset`
  border: 0;
  margin: 1em;
`;

const Legend = styled.legend`
  font-size: 2em;
  margin-bottom: 1em;
`;

const FieldSet = props => (
  <Wrapper>
    {props.legend && <Legend>{props.legend}</Legend>}
    {props.children}
  </Wrapper>
);

FieldSet.propTypes = {
  legend: React.PropTypes.string,
  children: React.PropTypes.oneOfType([
    React.PropTypes.arrayOf(React.PropTypes.node),
    React.PropTypes.node
  ])
};

export default FieldSet;
