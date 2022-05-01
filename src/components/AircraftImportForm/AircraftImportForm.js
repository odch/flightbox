import PropTypes from 'prop-types';
import React from 'react';
import CsvImportForm, { Example } from '../CsvImportForm';
import P from '../P';
import Em from '../Em';
import Strong from '../Strong';

const AircraftImportForm = props => {
  const description = (
    <div>
      <P>Für den Import wird eine CSV-Datei benötigt, die alle Flugzeuge enthält. Beim Import werden
        alle Flugzeuge aus der Datenbank entfernt, die nicht in der CSV-Datei enthalten sind.</P>
      <P>
        Die Datei muss aus den Spalten <Em>Registration</Em>, <Em>Type</Em>, <Em>MTOW</Em> und <Em>Category</Em> bestehen.
        Die Sortierung ist nicht relevant.
        Die CSV-Datei muss als <Strong>UTF-8</Strong>-Datei gespeichert sein.
      </P>
      <P>Muster mit zwei Flugzeugen:</P>
          <Example>
            Registration,Type,MTOW,Category<br/>
            HBKOF,DR40,1000,Flugzeug<br/>
            HBSGU,A210,750,Flugzeug<br/>
          </Example>
    </div>
  );

  return (
    <div className="AircraftImportForm">
      <CsvImportForm
        description={description}
        doneHeading="Flugzeuge importiert"
        doneMessage="Die Flugzeuge wurden importiert."
        selectedFile={props.selectedFile}
        disabled={props.disabled}
        importInProgress={props.importInProgress}
        importDone={props.importDone}
        importFailed={props.importFailed}
        selectFile={props.selectFile}
        startImport={props.startImport}
        closeDoneDialog={props.closeDoneDialog}
      />
    </div>
  );
};

AircraftImportForm.propTypes = {
  disabled: PropTypes.bool,
  importInProgress: PropTypes.bool.isRequired,
  importDone: PropTypes.bool.isRequired,
  importFailed: PropTypes.bool.isRequired,
  selectedFile: PropTypes.object,
  selectFile: PropTypes.func.isRequired,
  startImport: PropTypes.func.isRequired,
  closeDoneDialog: PropTypes.func.isRequired,
};

export default AircraftImportForm;
