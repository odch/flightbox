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
  loadAircrafts: React.PropTypes.func.isRequired,
  aircrafts: React.PropTypes.object.isRequired,
  value: React.PropTypes.string,
  onChange: React.PropTypes.func.isRequired,
  onFocus: React.PropTypes.func.isRequired,
  onBlur: React.PropTypes.func.isRequired,
  readOnly: React.PropTypes.bool,
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
