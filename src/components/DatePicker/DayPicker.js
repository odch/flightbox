import styled from 'styled-components';
import DayPicker from 'react-day-picker';
import 'react-day-picker/lib/style.css';

const StyledDayPicker = styled(DayPicker)`
  & .DayPicker-Weekday {
    color: ${props => props.theme.colors.main};
  }
  
  & .DayPicker-Day--today {
    color: ${props => props.theme.colors.danger};
  }
  
  & .DayPicker-Day--selected:not(.DayPicker-Day--disabled):not(.DayPicker-Day--outside) {
    background-color: ${props => props.theme.colors.main};
    
    &:hover {
      background-color: ${props => props.theme.colors.main};
    }
  }
`;

export default StyledDayPicker;
