import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.fieldset<{ $gutter?: boolean }>`
  border: 0;
  ${props => props.$gutter && `margin: 1em;`}
`;

const Legend = styled.legend`
  font-size: 2em;
  margin-bottom: 1em;
`;

const FieldSet = ({ legend, gutter = true, children }: any) => (
  <Wrapper $gutter={gutter}>
    {legend && <Legend>{legend}</Legend>}
    {children}
  </Wrapper>
);

FieldSet.propTypes = {
  legend: PropTypes.string,
  gutter: PropTypes.bool,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ])
};

export default FieldSet;
