import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
  padding: 0.2em;
`;

const Immatriculation = styled.div<{ $focussed?: boolean }>`
  margin-bottom: 0.2em;
  ${props => props.$focussed && `color: ${props.theme.colors.main}`};
`;

const Type = styled.div<{ $focussed?: boolean }>`
  font-size: 0.8em;
  color: ${props => props.$focussed ? props.theme.colors.main : `#888`};
`;

interface Props {
  immatriculation: string;
  type: string;
  focussed?: boolean;
}

const Option = (props: Props) => (
  <Wrapper>
    <Immatriculation $focussed={props.focussed}>{props.immatriculation}</Immatriculation>
    <Type $focussed={props.focussed}>{props.type}</Type>
  </Wrapper>
);

export default Option;
