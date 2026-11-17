import styled from 'styled-components';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';

// The class of blocked days (Calendar) and their colours: a dark red on a
// light red, readable for any theme (WCAG AA)
export const BLOCKED_CLASS = 'blocked-day';
export const BLOCKED_COLOR = '#b71c1c';
export const BLOCKED_BACKGROUND = 'rgba(224, 0, 0, 0.12)';

// Today bold in the main colour, the colour of the selected day's ring too;
// blocked days, which can still be chosen, in red
const StyledDayPicker = styled(DayPicker)`
  --rdp-accent-color: ${props => props.theme.colors.main};
  --rdp-accent-background-color: ${props => props.theme.colors.main};
  --rdp-today-color: ${props => props.theme.colors.main};

  .rdp-today:not(.rdp-outside) {
    font-weight: bold;
  }

  .${BLOCKED_CLASS} .rdp-day_button {
    color: ${BLOCKED_COLOR};
    background: ${BLOCKED_BACKGROUND};
  }
`;

export default StyledDayPicker;
