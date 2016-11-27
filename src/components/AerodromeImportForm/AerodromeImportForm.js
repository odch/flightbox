import React from 'react';
import CsvImportForm from '../CsvImportForm';

const AerodromeImportForm = props => {
  const description = (
    <div>
      <p>Für den Import wird eine CSV-Datei benötigt, die alle Flugplätze enthält. Beim Import werden
        alle Flugplätze aus der Datenbank entfernt, die nicht in der CSV-Datei enthalten sind.</p>
      <p>
        Die Datei muss aus den Spalten <em>Ident</em>, <em>Type</em>, <em>Name</em> und <em>IsoCountry</em> bestehen.
        Die Sortierung ist nicht relevant.
        Die CSV-Datei muss als <strong>UTF-8</strong>-Datei gespeichert sein.
      </p>
      <p>Muster mit zwei Flugplätzen:</p>
          <pre className="example">
            Ident,Type,Name,IsoCountry<br/>
            LSZT,small_airport,Lommis Airfield,CH<br/>
            LSZR,medium_airport,St Gallen Altenrhein Airport,CH<br/>
          </pre>
    </div>
  );

  return (
    <div className="AerodromeImportForm">
      <CsvImportForm
        description={description}
        doneHeading="Flugplätze importiert"
        doneMessage="Die Flugplätze wurden importiert."
        selectedFile={props.selectedFile}
        importDone={props.importDone}
        selectFile={props.selectFile}
        startImport={props.startImport}
        closeDoneDialog={props.closeDoneDialog}
      />
    </div>
  );
};

AerodromeImportForm.propTypes = {
  disabled: React.PropTypes.bool,
  importDone: React.PropTypes.bool.isRequired,
  selectedFile: React.PropTypes.object,
  selectFile: React.PropTypes.func.isRequired,
  startImport: React.PropTypes.func.isRequired,
  closeDoneDialog: React.PropTypes.func.isRequired,
};

export default AerodromeImportForm;
