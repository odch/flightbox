import PropTypes from 'prop-types';
import React, { Component } from 'react';
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
  const content = (
    <div>
      <Heading>Flugplatz-ICAO-Kürzel nicht gefunden</Heading>
      <Message>Das von Ihnen eingegebene Flugplatz-ICAO-Kürzel wurde in der Datenbank nicht gefunden.<br/>
        Geben Sie wenn möglich das ICAO-Kürzel und nicht den ausgeschriebenen Namen des Flugplatzes ein.<br/><br/>
        <Strong>Lokalflüge:</Strong> Für Lokalflüge ohne Zwischenlandung geben Sie bitte <Strong>{__CONF__.aerodrome.ICAO}</Strong> ein.<br/><br/>
        Möchten Sie Ihre Eingabe ändern oder möchten Sie wirklich den eingegebenen Flugplatz verwenden?
      </Message>
      <div>
        <ConfirmButton
          label="Eingegebenen Flugplatz verwenden"
          icon="done"
          onClick={props.onConfirm}
          dataCy="location-confirmation-dialog-confirm"
          danger
        />
        <CancelButton label="Eingabe ändern" onClick={props.onCancel} neutral/>
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
