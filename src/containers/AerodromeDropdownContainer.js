import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { loadAerodromes } from '../modules/aerodromes';
import AerodromeDropdown from '../components/AerodromeDropdown';

class AerodromeDropdownContainer extends Component {

  componentWillMount() {
    this.props.loadAerodromes();
  }

  render() {
    return (
      <AerodromeDropdown
        aerodromes={this.props.aerodromes}
        value={this.props.value}
        onChange={this.props.onChange}
        onFocus={this.props.onFocus}
        onBlur={this.props.onBlur}
        readOnly={this.props.readOnly}
        dataCy={this.props.dataCy}
      />
    );
  }
}

AerodromeDropdownContainer.propTypes = {
  loadAerodromes: PropTypes.func.isRequired,
  aerodromes: PropTypes.object.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  onFocus: PropTypes.func.isRequired,
  onBlur: PropTypes.func.isRequired,
  readOnly: PropTypes.bool,
  dataCy: PropTypes.string
};

const mapStateToProps = (state, ownProps) => {
  return {
    aerodromes: state.aerodromes,
    value: ownProps.value,
  };
};

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    loadAerodromes: () => dispatch(loadAerodromes()),
    onChange: ownProps.onChange,
    onFocus: ownProps.onFocus,
    onBlur: ownProps.onBlur,
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(AerodromeDropdownContainer);
