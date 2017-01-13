import React from 'react';
import styled from 'styled-components';
import MaterialIcon from '../MaterialIcon';

const Wrapper = styled.div`
  color: ${props => props.theme.colors.danger};
  overflow: hidden;
`;

const Icon = styled(MaterialIcon)`
  float: left;
`;

const Text = styled.div`
  font-style: italic;
  line-height: 1.3em;
  margin-left: 2em;
`;

const ValidationMessage = props => (
  <Wrapper>
    <Icon icon="error"/>
    <Text>{props.error}</Text>
  </Wrapper>
);

ValidationMessage.propTypes = {
  error: React.PropTypes.string.isRequired,
};

export default ValidationMessage;
