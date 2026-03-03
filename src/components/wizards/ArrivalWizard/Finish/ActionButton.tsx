import styled from 'styled-components';
import ImageButton from '../../../ImageButton';

const ActionButton = styled(ImageButton)`
  width: 50%;
  display: table-cell;

  @media screen and (max-width: 768px) {
    width: 100%;
    display: inline-block;
    margin-top: 2em;
  }
`;

export default ActionButton;
