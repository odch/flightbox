import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import moment from 'moment';
import Button from '../Button';
import DatePicker from '../DatePicker';
import Input from '../Input';
import LabeledComponent from '../LabeledComponent';
import MaterialIcon from '../MaterialIcon';

const StyledContainer = styled.div`
  background-color: #fbfbfb;
  box-shadow: 0 -1px 0 #e0e0e0, 0 0 2px rgba(0,0,0,.12), 0 2px 4px rgba(0,0,0,.24);
  margin-bottom: 1em;
  position: relative;
`;

const StyledButton = styled(Button)`
  background-color: #fbfbfb;
  width: 100%;
  text-align: left;
`;

const CheckboxWrapper = styled.div`
  padding: 1em;
`;

const StyledDateComponent = styled(LabeledComponent)`
  padding: 1em;
  box-sizing: border-box;
  display: inline-block;
  width: 50%;
`;

const StyledInput = styled(LabeledComponent)`
  padding: 1em;
`;

const ClearButton = styled.button`
  padding: 0;
  border: none;
  background-color: transparent;
  cursor: pointer;
  position: absolute;
  top: 15px;
  right: 10px;
`;

const renderDatePicker = (value, onChange) => (
  <DatePicker
    value={value ? moment(value).format('YYYY-MM-DD') : null}
    onChange={(e) => {
      const ms = e.value ? new Date(e.value).getTime() : null;
      onChange(ms);
    }}
    clearable
  />
);

const renderInput = (value, onChange, disabled) => (
  <Input value={value} onChange={onChange} disabled={disabled}/>
)

const renderCheckbox = (value, onChange, disabled) => (
  <CheckboxWrapper>
    <label>
      <Input
        type="checkbox"
        checked={value}
        onChange={onChange}
        disabled={disabled}
      />
      Nur Bewegungen ohne zugeordnete Gegenbewegung anzeigen
    </label>
  </CheckboxWrapper>
)

const handleStartDateChange = (currentFilter, onChange) => newValue => {
  onChange({
    ...currentFilter,
    date: {
      ...currentFilter.date,
      start: newValue,
    }
  })
}

const handleEndDateChange = (currentFilter, onChange) => newValue => {
  onChange({
    ...currentFilter,
    date: {
      ...currentFilter.date,
      end: newValue,
    }
  })
}

const handleImmatriculationChange = (currentFilter, onChange) => e => {
  onChange({
    ...currentFilter,
    immatriculation: e.target.value.toUpperCase()
  })
}

const handleOnlyWithoutAssociatedMovementChange = (currentFilter, onChange) => e => {
  onChange({
    ...currentFilter,
    onlyWithoutAssociatedMovement: e.target.checked
  })
}

const handleFilterClick = (expanded, setExpanded) => () => {
  setExpanded(!expanded);
}

const handleClear = setMovementsFilter => () => {
  setMovementsFilter({
    date: {
      start: null,
      end: null
    },
    immatriculation: '',
    onlyWithoutAssociatedMovement: false
  })
}

const MovementFilter = ({filter, expanded, setMovementsFilter, setExpanded}) => {
  const dateFilterSet = !!filter.date.start && !!filter.date.end
  return (
    <StyledContainer>
      <StyledButton
        icon="filter_list"
        label={dateFilterSet ? "Filter (aktiv)" : "Filter"}
        onClick={handleFilterClick(expanded, setExpanded)}
        danger={dateFilterSet}
        flat
      />
      {(expanded || dateFilterSet) && (
        <ClearButton onClick={handleClear(setMovementsFilter)}>
          <MaterialIcon icon="clear"/>
        </ClearButton>
      )}
      {expanded && (
        <div>
          <div>
            <StyledDateComponent
              label="Startdatum"
              component={renderDatePicker(filter.date.start, handleStartDateChange(filter, setMovementsFilter))}
              validationError={!filter.date.start && filter.date.end ? 'Bitte Startdatum setzen' : null}
            />
            <StyledDateComponent
              label="Enddatum"
              component={renderDatePicker(filter.date.end, handleEndDateChange(filter, setMovementsFilter))}
              validationError={!filter.date.end && filter.date.start ? 'Bitte Enddatum setzen' : null}
            />
          </div>
          <StyledInput label="Immatrikulation"
                       component={renderInput(
                         filter.immatriculation,
                         handleImmatriculationChange(filter, setMovementsFilter),
                         !dateFilterSet
                       )}
                       validationError={filter.immatriculation.length > 0 && filter.immatriculation.length < 3
                         ? 'Bitte mindestens 3 Zeichen eingeben'
                         : null}
          />
          {renderCheckbox(
            filter.onlyWithoutAssociatedMovement,
            handleOnlyWithoutAssociatedMovementChange(filter, setMovementsFilter),
            !dateFilterSet
          )}
        </div>
      )}
    </StyledContainer>
  );
}

MovementFilter.propTypes = {
  filter: PropTypes.shape({
    date: PropTypes.shape({
      start: PropTypes.number,
      end: PropTypes.number,
    }).isRequired,
    immatriculation: PropTypes.string
  }).isRequired,
  expanded: PropTypes.bool.isRequired,
  setExpanded: PropTypes.func.isRequired,
  setMovementsFilter: PropTypes.func.isRequired
}

export default MovementFilter;
