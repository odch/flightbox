import React from 'react';
import styled from 'styled-components';
import LabeledComponent from '../LabeledComponent';
import { MonthPicker } from '../DatePicker';

const StyledLabeledComponent = styled(LabeledComponent)`
  width: 45%;
  margin-bottom: 1.8em;
  
  @media screen and (max-width: 768px) {
    width: 100%;
  }
`;

const LabeledMonthPicker = props => {
  const monthPicker = (
    <MonthPicker
      value={props.date}
      onChange={(e) => props.setDate(e.value)}
    />
  );

  return <StyledLabeledComponent label="Monat" component={monthPicker}/>;
};

LabeledMonthPicker.propTypes = {
  date: React.PropTypes.string,
  setDate: React.PropTypes.func.isRequired
};

export default LabeledMonthPicker;
