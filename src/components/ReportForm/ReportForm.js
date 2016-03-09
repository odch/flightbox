import React, { Component } from 'react';
import LabeledComponent from '../LabeledComponent';
import LabeledBox from '../LabeledBox';
import DatePicker from '../DatePicker';
import MovementReport from '../../util/MovementReport.js';
import './ReportForm.scss';
import moment from 'moment';

class ReportForm extends Component {

  constructor(props) {
    super(props);
    this.state = {
      generationInProgress: false,
      startDate: moment().subtract(1, 'month').startOf('month').format('YYYY-MM-DD'),
      endDate: moment().subtract(1, 'month').endOf('month').format('YYYY-MM-DD'),
    };
  }

  render() {
    const startDatePicker = (
      <DatePicker
        value={this.state.startDate}
        onChange={(e) => this.setState({ startDate: e.value })}
      />
    );
    const endDatePicker = (
      <DatePicker
        value={this.state.endDate}
        onChange={(e) => this.setState({ endDate: e.value })}
      />
    );

    return (
      <LabeledBox label="CSV-Report herunterladen" className="ReportForm">
        <div>
          <LabeledComponent ref="startDate" label="Startdatum" component={startDatePicker}/>
          <LabeledComponent ref="endDate" label="Enddatum" component={endDatePicker}/>
        </div>
        {this.state.generationInProgress === true
          ? (
          <button
            onClick={this.buttonClickHandler.bind(this)}
            className="generate"
            disabled="disabled"
          >
            <i className="material-icons">file_download</i>&nbsp;Herunterladen
          </button>)
          : (
          <button
            onClick={this.buttonClickHandler.bind(this)}
            className="generate"
          >
            <i className="material-icons">file_download</i>&nbsp;Herunterladen
          </button>)
        }
      </LabeledBox>
    );
  }

  buttonClickHandler() {
    this.setState({
      generationInProgress: true,
    });
    new MovementReport(this.state.startDate, this.state.endDate)
      .generate(download => {
        this.setState({
          generationInProgress: false,
        });
        download.start();
      });
  }
}

export default ReportForm;
