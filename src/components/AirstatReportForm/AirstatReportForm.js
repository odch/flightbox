import React from 'react';
import classNames from 'classnames';
import ReportForm from '../ReportForm';
import './AirstatReportForm.scss';

const AirstatReportForm = props => (
  <ReportForm
    disabled={props.disabled}
    date={props.date}
    setDate={props.setDate}
    generate={props.generate}
  >
    <div className="checkbox-container">
      <label>
        <input
          type="checkbox"
          checked={props.internal}
          onChange={e => props.setInternal(e.target.checked)}
        />
        Zusätzliche Informationen inkludieren (nur für internen Gebrauch)
      </label>
    </div>
    <div className={classNames('internal-description', !props.internal && 'hidden')}>
      Der interne Report enthält zusätzlich die folgenden Informationen:
      <dl>
        <dt>KEY</dt>
        <dd>Die Referenznummer der Bewegung</dd>
        <dt>MEMBERNR</dt>
        <dd>Die Mitgliedernummer des Piloten</dd>
        <dt>LASTNAME</dt>
        <dd>Der Nachname des Piloten</dd>
        <dt>MTOW</dt>
        <dd>Das maximale Abfluggewicht</dd>
        <dt>MFGT</dt>
        <dd><emph>1</emph>, wenn Flugzeug der MFGT, sonst leer</dd>
        <dt>LSZT</dt>
        <dd><emph>1</emph>, wenn in Lommis stationiertes Flugzeug (ohne Flugzeuge der MFGT), sonst leer</dd>
        <dt>ORIGINAL_ORIDE</dt>
        <dd>Der ursprüngliche Start- oder Zielflugplatz, falls er nicht identifiziert werden konnte
          und durch <emph>LSZZ</emph> ersetzt wurde</dd>
        <dt>REMARKS</dt>
        <dd>Bemerkungen</dd>
      </dl>
    </div>
  </ReportForm>
);

AirstatReportForm.propTypes = {
  disabled: React.PropTypes.bool,
  date: React.PropTypes.string,
  internal: React.PropTypes.bool,
  setDate: React.PropTypes.func.isRequired,
  setInternal: React.PropTypes.func.isRequired,
  generate: React.PropTypes.func.isRequired,
};

export default AirstatReportForm;
