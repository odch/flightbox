import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
  padding: 0.2em;
`;

const Name = styled.div`
  margin-bottom: 0.2em;
  ${props => props.focussed && `color: ${props.theme.colors.main}`};
`;

const MemberNr = styled.div`
  font-size: 0.8em;
  color: ${props => props.focussed ? props.theme.colors.main : `#888`};
`;

const Option = props => (
  <Wrapper>
    <Name focussed={props.focussed}>{props.name}</Name>
    <MemberNr focussed={props.focussed}>{props.memberNr}</MemberNr>
  </Wrapper>
);

Option.propTypes = {
  name: React.PropTypes.string.isRequired,
  memberNr: React.PropTypes.string.isRequired,
  focussed: React.PropTypes.bool
};

export default Option;
