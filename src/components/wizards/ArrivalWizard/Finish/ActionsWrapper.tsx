import styled from 'styled-components';

const ActionsWrapper = styled.div`
  display: flex;
  justify-content: center;
  gap: 2em;
  padding-top: 1em;

  @media screen and (max-width: 500px) {
    flex-direction: column;
    align-items: center;
  }
`;

export default ActionsWrapper;
