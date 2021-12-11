import styled from 'styled-components';

const Message = styled.div`
  font-size: 1.5em;
  padding: 1em;
  margin-bottom: 1.5em;
`;

const ReferenceNumber = styled.span`
  font-weight: bold;
  background-color: rgba(255, 255, 0, 0.3);
`

const ReferenceNumberMessage = styled.div`
  font-size: 1.5em;
  font-weight: bold;
  background-color: rgba(255, 255, 0, 0.3);
  padding: 0.2em;
  display: inline-block;
`;

export {ReferenceNumber, ReferenceNumberMessage}
export default Message;
