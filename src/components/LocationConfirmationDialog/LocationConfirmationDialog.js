import React, {PropTypes, Component} from 'react';
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

const CancelButton = styled(Button)`
  float: left;
`;

const ConfirmButton = styled(Button)`
  float: right;
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
        <CancelButton label="Eingabe ändern" onClick={props.onCancel} flat neutral/>
        <ConfirmButton label="Eingegebenen Flugplatz verwenden" icon="done" onClick={props.onConfirm} danger/>
      </div>
    </div>
  );

  return <ModalDialog content={content} onBlur={props.onCancel}/>;
};

LocationConfirmationDialog.propTypes = {
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default LocationConfirmationDialog;
