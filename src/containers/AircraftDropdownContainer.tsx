import React, { useEffect } from 'react';
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

type Props = OwnProps & {
  aircrafts: object;
  loadAircrafts: () => void;
};

const AircraftDropdownContainer = (props: Props) => {
  useEffect(() => {
    props.loadAircrafts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AircraftDropdown
      aircrafts={props.aircrafts}
      value={props.value ?? ''}
      onChange={props.onChange}
      onFocus={props.onFocus}
      onBlur={props.onBlur}
      readOnly={props.readOnly}
      dataCy={props.dataCy}
      clearable={props.clearable}
    />
  );
};

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
