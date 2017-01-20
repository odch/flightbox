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
        Die Datei muss aus den Spalten <Em>Registration</Em>, <Em>Type</Em> und <Em>MTOW</Em> bestehen.
        Die Sortierung ist nicht relevant.
        Die CSV-Datei muss als <Strong>UTF-8</Strong>-Datei gespeichert sein.
      </P>
      <P>Muster mit zwei Flugzeugen:</P>
          <Example>
            Registration,Type,MTOW<br/>
            HBKOF,ROBIN DR 400/140 B,1000<br/>
            HBSGU,AT01,750<br/>
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
  disabled: React.PropTypes.bool,
  importInProgress: React.PropTypes.bool.isRequired,
  importDone: React.PropTypes.bool.isRequired,
  importFailed: React.PropTypes.bool.isRequired,
  selectedFile: React.PropTypes.object,
  selectFile: React.PropTypes.func.isRequired,
  startImport: React.PropTypes.func.isRequired,
  closeDoneDialog: React.PropTypes.func.isRequired,
};

export default AircraftImportForm;
