import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import dates from '../../util/dates';
import StatusShape from './StatusShape';
import {getLabel} from './StatusOptions';

const Wrapper = styled.div`
  ${props => props.selected && `font-weight: bold;`}
  ${props => !props.active && `cursor: pointer;`}
  ${props => props.active && `color: ${props.theme.colors.main};`}
  
  padding: 1em;
`;

const Column = styled.div`
  display: inline-block;
`;

const DateColumn = styled(Column)`
  float: right;
`;

const StatusHeader = props => (
  <Wrapper selected={props.selected} active={props.active} onClick={props.onClick}>
    <Column>{props.active && 'Aktiv: '}{getLabel(props.item.status)}</Column>
    <DateColumn>{dates.formatDateTime(props.item.timestamp)}</DateColumn>
  </Wrapper>
);

StatusHeader.propTypes = {
  item: StatusShape.isRequired,
  selected: PropTypes.bool.isRequired,
  active: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired
};

export default StatusHeader;
