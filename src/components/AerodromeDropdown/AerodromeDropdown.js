import React from 'react';
import Dropdown from '../Dropdown';
import './AerodromeDropdown.scss';

const optionRenderer = option => (
  <div>
    <div className="code">{option.key}</div>
    <div className="name">{option.name}</div>
  </div>
);

const aerodromesComparator = filter =>
  (aerodrome1, aerodrome2) => {
    // place key matches first
    if (filter) {
      if (aerodrome1.key.indexOf(filter) > -1 && aerodrome2.key.indexOf(filter) === -1) {
        return -1;
      }
      if (aerodrome1.key.indexOf(filter) === -1 && aerodrome2.key.indexOf(filter) > -1) {
        return 1;
      }
    }

    return aerodrome1.key.localeCompare(aerodrome2.key);
  };

const optionFilter = (options, filter) =>
  options
    .filter(option => option.key.indexOf(filter) > -1 || option.name.indexOf(filter) > -1)
    .sort(aerodromesComparator(filter));

const normalize = value => value.toUpperCase();

const callWithValue = (delegate, aerodromes, value) => {
  const aerodrome = aerodromes.find(item => item.key === value);
  if (aerodrome) {
    delegate(aerodrome);
  } else {
    delegate({
      key: value,
    });
  }
};

const AerodromeDropdown = props => (
  <Dropdown
    className="AerodromeDropdown"
    options={props.aerodromes.data.array.sort(aerodromesComparator())}
    optionRenderer={optionRenderer}
    optionFilter={optionFilter}
    onChange={callWithValue.bind(null, props.onChange, props.aerodromes.data.array)}
    onBeforeInputChange={normalize}
    value={props.value}
    noOptionsText="Kein Flugplatz gefunden"
    moreOptionsText="Mehr Flugplätze vorhanden! Tippen Sie einen Teil des ICAO-Codes oder des Namens, um die Liste einzuschränken."
    onFocus={props.onFocus}
    onBlur={callWithValue.bind(null, props.onBlur, props.aerodromes.data.array)}
  />
);

AerodromeDropdown.propTypes = {
  value: React.PropTypes.string.isRequired,
  aerodromes: React.PropTypes.object.isRequired,
  onChange: React.PropTypes.func.isRequired,
  onFocus: React.PropTypes.func.isRequired,
  onBlur: React.PropTypes.func.isRequired,
};

export default AerodromeDropdown;
