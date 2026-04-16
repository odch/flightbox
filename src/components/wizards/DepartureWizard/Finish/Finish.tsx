import PropTypes from 'prop-types';
import React from 'react';
import ImageButton from '../../../ImageButton';
import SaveProfilePrompt from '../../SaveProfilePrompt';
import Wrapper from '../../ArrivalWizard/Finish/Wrapper';
import Heading from '../../ArrivalWizard/Finish/Heading';
import { useTranslation } from 'react-i18next';

const Finish = props => {
  const { t } = useTranslation();
  const exitImagePath = require('./ic_exit_to_app_black_48dp_2x.png');
  return (
    <Wrapper>
      <Heading>{props.isUpdate === true ? t('departure.updated') : t('departure.created')}</Heading>
      {!props.isUpdate && <SaveProfilePrompt/>}
      <ImageButton label={t('departure.finish')} img={exitImagePath} onClick={props.finish} dataCy="finish-button"/>
    </Wrapper>
  );
};

Finish.propTypes = {
  finish: PropTypes.func.isRequired,
  isUpdate: PropTypes.bool.isRequired,
};

export default Finish;
