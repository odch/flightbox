import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import ImageButton from '../../../ImageButton';
import { useTranslation } from 'react-i18next';

const Wrapper = styled.div`
  text-align: center;
`;

const Message = styled.div`
  font-size: 2em;
  padding: 2em;
`;

const Finish = props => {
  const { t } = useTranslation();
  const exitImagePath = require('./ic_exit_to_app_black_48dp_2x.png');
  return (
    <Wrapper>
      <Message>{props.isUpdate === true ? t('departure.updated') : t('departure.created')}</Message>
      <ImageButton label={t('departure.finish')} img={exitImagePath} onClick={props.finish} dataCy="finish-button"/>
    </Wrapper>
  );
};

Finish.propTypes = {
  finish: PropTypes.func.isRequired,
  isUpdate: PropTypes.bool.isRequired,
};

export default Finish;
