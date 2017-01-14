import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
  padding: 0.2em;
`;

const Immatriculation = styled.div`
  margin-bottom: 0.2em;
  ${props => props.focussed && `color: ${props.theme.colors.main}`};
`;

const Type = styled.div`
  font-size: 0.8em;
  color: ${props => props.focussed ? props.theme.colors.main : `#888`};
`;

const Option = props => (
  <Wrapper>
    <Immatriculation focussed={props.focussed}>{props.immatriculation}</Immatriculation>
    <Type focussed={props.focussed}>{props.type}</Type>
  </Wrapper>
);

Option.propTypes = {
  immatriculation: React.PropTypes.string.isRequired,
  type: React.PropTypes.string.isRequired,
  focussed: React.PropTypes.bool
};

export default Option;
