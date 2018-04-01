import PropTypes from 'prop-types';
import React from 'react';
import CsvImportForm, { Example } from '../CsvImportForm';
import P from '../P';
import Em from '../Em';
import Strong from '../Strong';

const UserImportForm = props => {
  const description = (
    <div>
      <P>Für den Import wird eine CSV-Datei benötigt, die alle Benutzer enthält. Beim Import werden
        alle Benutzer aus der Datenbank entfernt, die nicht in der CSV-Datei enthalten sind.</P>
      <P>
        Die Datei muss aus den Spalten <Em>UserName</Em>, <Em>LastName</Em>, <Em>FirstName</Em> und <Em>PhoneMobile</Em> bestehen.
        Die Sortierung ist nicht relevant.
        Die CSV-Datei muss als <Strong>UTF-8</Strong>-Datei gespeichert sein.
      </P>
      <P>Muster mit zwei Personen:</P>
          <Example>
            UserName,LastName,FirstName,PhoneMobile<br/>
            11069,Mustermann,Max,+41791234567<br/>
            11293,Musterfrau,Maria,+41768765432<br/>
          </Example>
    </div>
  );

  return (
    <div className="UserImportForm">
      <CsvImportForm
        description={description}
        doneHeading="Benutzer importiert"
        doneMessage="Die Benutzer wurden importiert."
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

UserImportForm.propTypes = {
  disabled: PropTypes.bool,
  importInProgress: PropTypes.bool.isRequired,
  importDone: PropTypes.bool.isRequired,
  importFailed: PropTypes.bool.isRequired,
  selectedFile: PropTypes.object,
  selectFile: PropTypes.func.isRequired,
  startImport: PropTypes.func.isRequired,
  closeDoneDialog: PropTypes.func.isRequired,
};

export default UserImportForm;
