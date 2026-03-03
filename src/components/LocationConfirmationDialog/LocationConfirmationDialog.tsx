import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import ModalDialog from '../ModalDialog';
import Button from '../Button';
import Strong from '../Strong';

const Heading = styled.div`
  font-size: 1.5em;
  margin-bottom: 1em;
`;

const Message = styled.div`
  margin-bottom: 2em;
`;

const DialogButton = styled(Button)`
  @media(max-width: 800px) {
    width: 100%;
  }
`;

const CancelButton = styled(DialogButton)`
  float: left;
`;

const ConfirmButton = styled(DialogButton)`
  float: right;
  
  @media(max-width: 800px) {
    margin-top: 1em;
    margin-bottom: 1em;
  }
`;

const LocationConfirmationDialog = props => {
  const { t } = useTranslation();
  const content = (
    <div>
      <Heading>{t('locationDialog.heading')}</Heading>
      <Message>{t('locationDialog.notFound')}<br/>
        {t('locationDialog.hint')}<br/><br/>
        <Strong>{t('locationDialog.localFlights')}</Strong> {t('locationDialog.localFlightsHint')} <Strong>{__CONF__.aerodrome.ICAO}</Strong> {t('locationDialog.localFlightsHintEnd')}<br/><br/>
        {t('locationDialog.question')}
      </Message>
      <div>
        <ConfirmButton
          label={t('locationDialog.useAnyway')}
          icon="done"
          onClick={props.onConfirm}
          dataCy="location-confirmation-dialog-confirm"
          danger
        />
        <CancelButton label={t('locationDialog.change')} onClick={props.onCancel} neutral/>
      </div>
    </div>
  );

  return <ModalDialog content={content} onBlur={props.onCancel} fullWidthThreshold={800}/>;
};

LocationConfirmationDialog.propTypes = {
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default LocationConfirmationDialog;
