import React from 'react';
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
