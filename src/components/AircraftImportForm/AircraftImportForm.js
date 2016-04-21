import React, { Component } from 'react';
import CsvImportForm from '../CsvImportForm';
import importAircrafts from '../../util/aircraft-import.js';

class AircraftImportForm extends Component {

  render() {
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
          importFunc={importAircrafts}
        />
      </div>
    );
  }
}

export default AircraftImportForm;
