import styled from 'styled-components';

const ErrorMessage = styled.div`
  border: 1px solid ${props => props.theme.colors.danger};
  background-color: #fffafa;
  color: ${props => props.theme.colors.danger};
  border-radius: 4px;
  padding: 0.5em;
  margin-top: 1em;
  margin-bottom: 0.5em;
`;

export default ErrorMessage;
