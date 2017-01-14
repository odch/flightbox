import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
  padding: 0.2em;
`;

const Code = styled.div`
  margin-bottom: 0.2em;
  ${props => props.focussed && `color: ${props.theme.colors.main}`};
`;

const Name = styled.div`
  font-size: 0.8em;
  color: ${props => props.focussed ? props.theme.colors.main : `#888`};
`;

const Option = props => (
  <Wrapper>
    <Code focussed={props.focussed}>{props.code}</Code>
    <Name focussed={props.focussed}>{props.name}</Name>
  </Wrapper>
);

Option.propTypes = {
  code: React.PropTypes.string.isRequired,
  name: React.PropTypes.string.isRequired,
  focussed: React.PropTypes.bool
};

export default Option;
