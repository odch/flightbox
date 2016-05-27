import React from 'react';
import classNames from 'classnames';
import ReportForm from '../ReportForm';
import LabeledBox from '../LabeledBox';
import { airstat } from '../../util/report';
import './AirstatReportForm.scss';

class AirstatReportForm extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      internal: false,
    };
  }

  render() {
    return (
      <LabeledBox label="BAZL-Report herunterladen (CSV)" className="AirstatReportForm">
        <ReportForm generate={this.generate.bind(this)}>
          <div className="checkbox-container">
            <label>
              <input type="checkbox" checked={this.state.internal} onChange={this.onChange.bind(this)}/>
              Zusätzliche Informationen inkludieren (nur für internen Gebrauch)
            </label>
          </div>
          <div className={classNames('internal-description', !this.state.internal && 'hidden')}>
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
      </LabeledBox>
    );
  }

  generate(startDate, endDate) {
    const options = {
      internal: this.state.internal,
    };
    return airstat(startDate, endDate, options);
  }

  onChange(e) {
    this.setState({
      internal: e.target.checked,
    });
  }
}

export default AirstatReportForm;
