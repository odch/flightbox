import styled from 'styled-components';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';

const StyledDayPicker = styled(DayPicker)`
  --rdp-accent-color: ${props => props.theme.colors.main};
  --rdp-accent-background-color: ${props => props.theme.colors.main};
  --rdp-today-color: ${props => props.theme.colors.danger};
`;

export default StyledDayPicker;
