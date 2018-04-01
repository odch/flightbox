import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { loadAircrafts } from '../modules/aircrafts';
import AircraftDropdown from '../components/AircraftDropdown';

class AircraftDropdownContainer extends Component {

  componentWillMount() {
    this.props.loadAircrafts();
  }

  render() {
    return (
      <AircraftDropdown
        aircrafts={this.props.aircrafts}
        value={this.props.value}
        onChange={this.props.onChange}
        onFocus={this.props.onFocus}
        onBlur={this.props.onBlur}
        readOnly={this.props.readOnly}
      />
    );
  }
}

AircraftDropdownContainer.propTypes = {
  loadAircrafts: PropTypes.func.isRequired,
  aircrafts: PropTypes.object.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  onFocus: PropTypes.func.isRequired,
  onBlur: PropTypes.func.isRequired,
  readOnly: PropTypes.bool,
};

const mapStateToProps = (state, ownProps) => {
  return {
    aircrafts: state.aircrafts,
    value: ownProps.value,
  };
};

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    loadAircrafts: () => dispatch(loadAircrafts()),
    onChange: ownProps.onChange,
    onFocus: ownProps.onFocus,
    onBlur: ownProps.onBlur,
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(AircraftDropdownContainer);
