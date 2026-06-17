import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

const Wrapper = styled.div`
  color: #ed351c;
  margin-bottom: 2em;
`;

const Failure = props => {
  const { t } = useTranslation();
  const messageKey = props.messageKey || 'login.failure';
  return (
    <Wrapper>{props.failure ? t(messageKey) : '\u00a0'}</Wrapper>
  );
};

Failure.propTypes = {
  failure: PropTypes.bool.isRequired,
  messageKey: PropTypes.string
};

export default Failure;
