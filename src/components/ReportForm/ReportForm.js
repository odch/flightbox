import React, { Component } from 'react';
import LabeledComponent from '../LabeledComponent';
import DatePicker from '../DatePicker';
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
      <div className="ReportForm">
        <div>
          <LabeledComponent ref="startDate" label="Startdatum" component={startDatePicker}/>
          <LabeledComponent ref="endDate" label="Enddatum" component={endDatePicker}/>
        </div>
        {this.props.children}
        <button
          onClick={this.buttonClickHandler.bind(this)}
          className="generate"
          disabled={this.state.generationInProgress === true}
        >
          <i className="material-icons">file_download</i>&nbsp;Herunterladen
        </button>
      </div>
    );
  }

  buttonClickHandler() {
    this.setState({
      generationInProgress: true,
    });
    this.props.generate(this.state.startDate, this.state.endDate)
      .then(download => {
        this.setState({
          generationInProgress: false,
        });
        download.start();
      });
  }
}

ReportForm.propTypes = {
  generate: React.PropTypes.func.isRequired,
  children: React.PropTypes.node,
};

export default ReportForm;
