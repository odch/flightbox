import styled from 'styled-components';
import Message from './Message';

const FailureMessage = styled(Message)`
  color: ${props => props.theme.colors.danger};
`;

export default FailureMessage;
