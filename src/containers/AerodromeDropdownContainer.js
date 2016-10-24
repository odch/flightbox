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
      />
    );
  }
}

AerodromeDropdownContainer.propTypes = {
  loadAerodromes: React.PropTypes.func.isRequired,
  aerodromes: React.PropTypes.object.isRequired,
  value: React.PropTypes.string,
  onChange: React.PropTypes.func.isRequired,
  onFocus: React.PropTypes.func.isRequired,
  onBlur: React.PropTypes.func.isRequired,
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
