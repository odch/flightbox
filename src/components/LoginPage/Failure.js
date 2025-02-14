import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
  color: #ed351c;
  margin-bottom: 2em;
`;

const Failure = props => (
  <Wrapper>{props.failure ? 'Anmeldung fehlgeschlagen' : '\u00a0'}</Wrapper>
);

Failure.propTypes = {
  failure: PropTypes.bool.isRequired
};

export default Failure;
