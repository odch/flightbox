import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import MaterialIcon from '../MaterialIcon';

// The icon in the middle of the text beside it, whatever its number of lines
const Wrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5em;
  color: ${props => props.theme.colors.danger};
`;

const Icon = styled(MaterialIcon)`
  flex: none;
`;

const Text = styled.div`
  min-width: 0;
  font-style: italic;
  line-height: 1.3em;
`;

const ValidationMessage = ({ error }: any) => (
  <Wrapper>
    <Icon icon="error"/>
    <Text>{error}</Text>
  </Wrapper>
);

ValidationMessage.propTypes = {
  error: PropTypes.string.isRequired,
};

export default ValidationMessage;
