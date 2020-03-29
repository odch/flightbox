import React from 'react';
import styled from 'styled-components';
import StatusShape from './StatusShape';
import newLineToBr from '../../util/newLineToBr';

const Wrapper = styled.div`
  padding: 1em;
  line-height: 1.3em;
`;

const Contact = styled.div`
  font-weight: bold;
`;

const Author = styled.div`
  text-align: right;
  font-style: italic;
`

const StatusContent = props => (
  <Wrapper>
    {props.item.details && <div>{newLineToBr(props.item.details)}</div>}
    {props.item.by && <Author>von {props.item.by}</Author>}
  </Wrapper>
);

StatusContent.propTypes = {
  item: StatusShape.isRequired
};

export default StatusContent;
