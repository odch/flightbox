import React from 'react';
import CsvImportForm, { Example } from '../CsvImportForm';
import P from '../P';
import Em from '../Em';
import Strong from '../Strong';

const AerodromeImportForm = props => {
  const description = (
    <div>
      <P>Für den Import wird eine CSV-Datei benötigt, die alle Flugplätze enthält. Beim Import werden
        alle Flugplätze aus der Datenbank entfernt, die nicht in der CSV-Datei enthalten sind.</P>
      <P>
        Die Datei muss aus den Spalten <Em>Ident</Em>, <Em>Type</Em>, <Em>Name</Em> und <Em>IsoCountry</Em> bestehen.
        Die Sortierung ist nicht relevant.
        Die CSV-Datei muss als <Strong>UTF-8</Strong>-Datei gespeichert sein.
      </P>
      <P>Muster mit zwei Flugplätzen:</P>
          <Example>
            Ident,Type,Name,IsoCountry<br/>
            LSZT,small_airport,Lommis Airfield,CH<br/>
            LSZR,medium_airport,St Gallen Altenrhein Airport,CH<br/>
          </Example>
    </div>
  );

  return (
    <div className="AerodromeImportForm">
      <CsvImportForm
        description={description}
        doneHeading="Flugplätze importiert"
        doneMessage="Die Flugplätze wurden importiert."
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

AerodromeImportForm.propTypes = {
  disabled: React.PropTypes.bool,
  importInProgress: React.PropTypes.bool.isRequired,
  importDone: React.PropTypes.bool.isRequired,
  importFailed: React.PropTypes.bool.isRequired,
  selectedFile: React.PropTypes.object,
  selectFile: React.PropTypes.func.isRequired,
  startImport: React.PropTypes.func.isRequired,
  closeDoneDialog: React.PropTypes.func.isRequired,
};

export default AerodromeImportForm;
