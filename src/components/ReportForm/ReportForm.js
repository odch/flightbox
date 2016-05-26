import React, { Component } from 'react';
import LabeledComponent from '../LabeledComponent';
import { MonthPicker } from '../DatePicker';
import './ReportForm.scss';
import moment from 'moment';

class ReportForm extends Component {

  constructor(props) {
    super(props);
    this.state = {
      generationInProgress: false,
      date: moment().subtract(1, 'month').startOf('month').format('YYYY-MM-DD'),
    };
  }

  render() {
    const monthPicker = (
      <MonthPicker
        value={this.state.date}
        onChange={(e) => this.setState({ date: e.value })}
      />
    );

    return (
      <div className="ReportForm">
        <div>
          <LabeledComponent label="Monat" component={monthPicker}/>
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
    const startDate = this.state.date;
    const endDate = moment(this.state.date).endOf('month').format('YYYY-MM-DD');
    this.props.generate(startDate, endDate)
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
