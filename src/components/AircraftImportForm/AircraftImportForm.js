import React from 'react';
import CsvImportForm from '../CsvImportForm';

const AircraftImportForm = props => {
  const description = (
    <div>
      <p>Für den Import wird eine CSV-Datei benötigt, die alle Flugzeuge enthält. Beim Import werden
        alle Flugzeuge aus der Datenbank entfernt, die nicht in der CSV-Datei enthalten sind.</p>
      <p>
        Die Datei muss aus den Spalten <em>Registration</em>, <em>Type</em> und <em>MTOW</em> bestehen.
        Die Sortierung ist nicht relevant.
        Die CSV-Datei muss als <strong>UTF-8</strong>-Datei gespeichert sein.
      </p>
      <p>Muster mit zwei Flugzeugen:</p>
          <pre className="example">
            Registration,Type,MTOW<br/>
            HBKOF,ROBIN DR 400/140 B,1000<br/>
            HBSGU,AT01,750<br/>
          </pre>
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
  selectedFile: React.PropTypes.object,
  selectFile: React.PropTypes.func.isRequired,
  startImport: React.PropTypes.func.isRequired,
  closeDoneDialog: React.PropTypes.func.isRequired,
};

export default AircraftImportForm;
