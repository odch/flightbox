import React, { Component, PropTypes } from 'react';
import ModalDialog from '../ModalDialog';
import ReactDatePicker from 'react-date-picker';
import classNames from 'classnames';
import 'react-date-picker/base.css';
import './DatePicker.scss';
import dates from '../../util/dates';

class DatePicker extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showPicker: false,
      value: props.value,
    };
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      value: nextProps.value,
    });
  }

  render() {
    if (this.props.readOnly === true) {
      return (
        <div className="DateTimePicker readonly">
          <div className="value">
            {this.state.value ? dates.formatDate(this.state.value) : '\u00a0'}
          </div>
        </div>
      );
    }

    let dialog;
    if (this.state.showPicker === true) {
      const picker = this.renderPicker();
      dialog = (
        <ModalDialog content={picker} onBlur={this.hidePicker.bind(this)}/>
      );
    }
    return (
      <div className={classNames('DatePicker', this.getClassName())}>
        <div className="value" onClick={this.showPicker.bind(this)}>
          {this.state.value ? this.renderValue() : '\u00a0'}
          {this.props.clearable === true && this.state.value
            ? <button className="clear" onClick={this.clearButtonHandler.bind(this)}>
                <i className="material-icons">clear</i>
              </button>
            : null}
        </div>
        {dialog}
      </div>
    );
  }

  getClassName() {
    return null;
  }

  renderValue() {
    return dates.formatDate(this.state.value);
  }

  renderPicker() {
    return (
      <ReactDatePicker
        date={this.state.value}
        onChange={this.updateValueHandler.bind(this)}
        hideFooter={true}
        locale="de"
      />
    );
  }

  updateValueHandler(dateString) {
    this.setState({
      showPicker: false,
      value: dateString,
    });
    if (typeof this.props.onChange === 'function') {
      this.props.onChange({
        value: dateString,
      });
    }
  }

  clearButtonHandler(e) {
    e.stopPropagation(); // prevent call of outer div onClick handler
    this.updateValueHandler(null);
  }

  showPicker() {
    this.setState({
      showPicker: true,
    });
  }

  hidePicker() {
    this.setState({
      showPicker: false,
    });
  }
}

DatePicker.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  clearable: PropTypes.bool,
  readOnly: PropTypes.bool,
};

DatePicker.defaultProps = {
  clearable: false,
};

class MonthPicker extends DatePicker {

  getClassName() {
    return 'month';
  }

  renderValue() {
    return dates.formatMonth(this.state.value);
  }

  renderPicker() {
    return (
      <ReactDatePicker
        date={this.state.value}
        hideFooter={true}
        locale="de"
        view="year"
        onSelect={this.selectHandler.bind(this)}
      />
    );
  }

  selectHandler(dateString, moment, view) {
    if (view === 'month') {
      this.updateValueHandler(dateString);
    }
  }
}

export default DatePicker;
export { MonthPicker };
