import React, {Component} from 'react';
import {connect} from 'react-redux';
import {loadAircrafts} from '../modules/aircrafts';
import AircraftDropdown from '../components/AircraftDropdown';
import {RootState} from '../modules';

interface OwnProps {
  value?: string;
  onChange: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  readOnly?: boolean;
  clearable?: boolean;
  dataCy?: string;
}

class AircraftDropdownContainer extends Component<OwnProps & {
  aircrafts: object;
  loadAircrafts: () => void;
}> {
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
        dataCy={this.props.dataCy}
        clearable={this.props.clearable}
      />
    );
  }
}

const mapStateToProps = (state: RootState, ownProps: OwnProps) => ({
  aircrafts: state.aircrafts,
  value: ownProps.value,
});

const mapDispatchToProps = (dispatch: any, ownProps: OwnProps) => ({
  loadAircrafts: () => dispatch(loadAircrafts()),
  onChange: ownProps.onChange,
  onFocus: ownProps.onFocus,
  onBlur: ownProps.onBlur,
});

export default connect(mapStateToProps, mapDispatchToProps)(AircraftDropdownContainer);
