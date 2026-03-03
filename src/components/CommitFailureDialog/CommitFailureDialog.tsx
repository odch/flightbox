import PropTypes from 'prop-types';
import React from 'react';
import { useTranslation } from 'react-i18next';
import ModalDialog from '../ModalDialog';
import Heading from './Heading';
import ErrorMessage from './ErrorMessage';
import CloseButton from './CloseButton';

const CommitFailureDialog = props => {
  const { t } = useTranslation();
  const content = (
    <div>
      <Heading>{t('commitFailure.heading')}</Heading>
      <div>{t('commitFailure.message')}</div>
      {props.errorMsg && <ErrorMessage>{props.errorMsg}</ErrorMessage>}
      <div>
        <CloseButton label={t('commitFailure.closeButton')} onClick={props.onClose} flat/>
      </div>
    </div>
  );

  return <ModalDialog content={content} onBlur={props.onClose}/>;
};

CommitFailureDialog.propTypes = {
  onClose: PropTypes.func.isRequired,
  errorMsg: PropTypes.string,
};

export default CommitFailureDialog;
