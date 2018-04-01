import PropTypes from 'prop-types';
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
  disabled: PropTypes.bool,
  importInProgress: PropTypes.bool.isRequired,
  importDone: PropTypes.bool.isRequired,
  importFailed: PropTypes.bool.isRequired,
  selectedFile: PropTypes.object,
  selectFile: PropTypes.func.isRequired,
  startImport: PropTypes.func.isRequired,
  closeDoneDialog: PropTypes.func.isRequired,
};

export default AerodromeImportForm;
