import PropTypes from 'prop-types';
import React, { Component } from 'react';
import ModalDialog from '../ModalDialog';
import MaterialIcon from '../MaterialIcon';
import MomentLocaleUtils from 'react-day-picker/moment';
import dates from '../../util/dates';
import Wrapper from './Wrapper';
import DayPicker from './DayPicker';
import ClearButton from './ClearButton';
import Value from './Value';

class DatePicker extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showPicker: false,
      value: props.value,
    };

    this.handleDayClick = this.handleDayClick.bind(this);
    this.showPicker = this.showPicker.bind(this);
    this.hidePicker = this.hidePicker.bind(this);
    this.handleClear = this.handleClear.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      value: nextProps.value,
    });
  }

  render() {
    if (this.props.readOnly === true) {
      return (
        <Wrapper readOnly>
          <Value>
            {this.state.value ? dates.formatDate(this.state.value) : '\u00a0'}
          </Value>
        </Wrapper>
      );
    }

    let dialog;
    if (this.state.showPicker === true) {
      const picker = this.renderPicker();
      dialog = (
        <ModalDialog content={picker} onBlur={this.hidePicker} fullWidthThreshold={0}/>
      );
    }
    return (
      <Wrapper>
        <Value onClick={this.showPicker} data-cy={this.props.dataCy}>
          {this.state.value ? this.renderValue() : '\u00a0'}
          {this.props.clearable === true && this.state.value
            ? <ClearButton onClick={this.handleClear}>
                <MaterialIcon icon="clear"/>
            </ClearButton>
            : null}
        </Value>
        {dialog}
      </Wrapper>
    );
  }

  renderValue() {
    return dates.formatDate(this.state.value);
  }

  renderPicker() {
    const date = this.state.value ? new Date(this.state.value) : undefined;
    return (
      <DayPicker
        selectedDays={date}
        initialMonth={date}
        onDayClick={this.handleDayClick}
        localeUtils={MomentLocaleUtils}
        locale="de"
      />
    );
  }

  handleDayClick(date) {
    const dateString = date ? dates.localDate(date) : null;
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

  handleClear(e) {
    e.stopPropagation(); // prevent call of outer div onClick handler
    this.handleDayClick(null);
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

export default DatePicker;
