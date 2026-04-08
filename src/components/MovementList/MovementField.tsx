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

const MovementField = ({ label, value, defaultValue = 'k.A.' }: any) => (
  <Wrapper>
    <Label>{label}</Label>
    <Value $hasValue={!!value}>{value == null ? defaultValue : value}</Value>
  </Wrapper>
);

MovementField.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.any,
  defaultValue: PropTypes.any,
};

export default MovementField;
