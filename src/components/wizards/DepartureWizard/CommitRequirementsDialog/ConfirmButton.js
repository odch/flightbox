import styled from 'styled-components';
import DialogButton from './DialogButton';

const ConfirmButton = styled(DialogButton)`
  float: right;
  
  @media(max-width: 600px) {
    margin-top: 1em;
    margin-bottom: 1em;
  }
`;

export default ConfirmButton;
