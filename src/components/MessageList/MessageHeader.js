import React from 'react';
import styled from 'styled-components';
import dates from '../../util/dates';
import MessageShape from './MessageShape';

const Wrapper = styled.div`
  ${props => props.selected && `font-weight: bold;`}
`;

const Column = styled.div`
  display: inline-block;
`;

const DateColumn = styled(Column)`
  float: right;
`;

const MessageHeader = props => (
  <Wrapper selected={props.selected}>
    <Column>{props.item.name}</Column>
    <DateColumn>{dates.formatDate(props.item.timestamp)}</DateColumn>
  </Wrapper>
);

MessageHeader.propTypes = {
  item: MessageShape.isRequired,
  selected: React.PropTypes.bool.isRequired
};

export default MessageHeader;
