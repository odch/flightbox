import React from 'react';
import styled from 'styled-components';
import StatusShape from './StatusShape';
import newLineToBr from '../../util/newLineToBr';
import formatUpdatedBy from '../../util/formatUpdatedBy';

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

const StatusContent = props => {
  const author = formatUpdatedBy(props.item);
  return (
    <Wrapper>
      {props.item.details && <div>{newLineToBr(props.item.details)}</div>}
      {author && <Author>von {author}</Author>}
    </Wrapper>
  );
};

StatusContent.propTypes = {
  item: StatusShape.isRequired
};

export default StatusContent;
