import React, { Component } from 'react';
import CsvImportForm from '../CsvImportForm';
import importUsers from '../../util/user-import.js';

class UserImportForm extends Component {

  render() {
    const description = (
      <div>
        <p>Für den Import wird eine CSV-Datei benötigt, die alle Benutzer enthält. Beim Import werden
          alle Benuter aus der Datenbank entfernt, die nicht in der CSV-Datei enthalten sind.</p>
        <p>
          Die Datei muss aus den Spalten <em>UserName</em>, <em>LastName</em>, <em>FirstName</em> und <em>PhoneMobile</em> bestehen.
          Die Sortierung ist nicht relevant.
          Die CSV-Datei muss als <strong>UTF-8</strong>-Datei gespeichert sein.
        </p>
        <p>Muster mit zwei Personen:</p>
            <pre className="example">
              UserName,LastName,FirstName,PhoneMobile<br/>
              11069,Mustermann,Max,+41791234567<br/>
              11293,Musterfrau,Maria,+41768765432<br/>
            </pre>
      </div>
    );

    return (
      <div className="UserImportForm">
        <CsvImportForm
          description={description}
          doneHeading="Benutzer importiert"
          doneMessage="Die Benutzer wurden importiert."
          importFunc={importUsers}
        />
      </div>
    );
  }
}

export default UserImportForm;
