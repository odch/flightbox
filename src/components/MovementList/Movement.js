import React, { PropTypes, Component } from 'react';
import MaterialIcon from '../MaterialIcon';
import styled from 'styled-components';
import dates from '../../util/dates';

const Wrapper = styled.div`
  padding: 1em;
  overflow: hidden;
  cursor: pointer;
  ${props => props.locked && `color: #555;`}
  
  &:hover {
    background-color: ${props => props.theme.colors.background};
  }
  
  .immatriculation, .pilot, .datetime, .location, .delete {
    width: 15%;
  }

  .action {
    width: 25%;
  }
    
  @media (max-width: 980px) {
    .immatriculation, .pilot, .datetime, .location {
      width: 21.25%;
    }

    .action, .delete {
      width: 7.5%;
    }
  }

  @media (max-width: 600px) {
    .location {
      display: none;
    }

    .immatriculation, .pilot, .datetime {
      width: 26%;
    }

    .action, .delete {
      width: 11%;
    }
  }
`;

const Column = styled.div`
  display: inline-block;
  vertical-align: top;
  width: ${props => props.width};
`;

const ActionColumn = styled(Column)`
  text-align: right;
  font-size: 1.2em;
`;

const Date = styled.div`
  margin-bottom: 0.2em;
`;

const StyledAction = styled.span`
  &:hover {
    color: ${props => props.theme.colors.main};
  }
`;

const ActionLabel = styled.span`
  @media (max-width: 980px) {
    display: none;
  }
`;

const Action = props => (
  <StyledAction onClick={props.onClick} className={props.className}>
    <MaterialIcon icon={props.icon}/><ActionLabel>&nbsp;{props.label}</ActionLabel>
  </StyledAction>
);

const handleActionClick = (onAction, data, e) => {
  e.stopPropagation(); // prevent call of onClick handler
  if (typeof onAction === 'function') {
    onAction(data);
  }
};

const handleDeleteClick = (onDelete, data, e) => {
  e.stopPropagation(); // prevent call of onClick handler
  if (typeof onDelete === 'function') {
    onDelete(data);
  }
};

const getLocation = data => {
  if (data.location.toUpperCase() === __CONF__.aerodrome.ICAO) {
    if (data.departureRoute === 'circuits' || data.arrivalRoute === 'circuits') {
      return 'Platzrunden';
    }
    return 'Lokalflug';
  }
  return data.location;
};

const Movement = props =>{
  const date = props.timeWithDate === true
    ? dates.formatDate(props.data.date)
    : null;
  const time = dates.formatTime(props.data.date, props.data.time);

  return (
    <Wrapper onClick={props.onClick} locked={props.locked}>
      <Column className="immatriculation">{props.data.immatriculation}</Column>
      <Column className="pilot">{props.data.lastname}</Column>
      <Column className="datetime">
        {date && <Date className="date">{date}</Date>}
        <div className="time">{time}</div>
      </Column>
      <Column className="location">{getLocation(props.data)}</Column>
      <ActionColumn className="action">
        <Action
          label={props.actionLabel}
          icon={props.actionIcon}
          onClick={handleActionClick.bind(null, props.onAction, props.data)}
        />
      </ActionColumn>
      <ActionColumn className="delete">
        {!props.locked && (
          <Action
            label="Löschen"
            icon="delete"
            onClick={handleDeleteClick.bind(null, props.onDelete, props.data)}
          />
        )}
      </ActionColumn>
    </Wrapper>
  );
};

Movement.propTypes = {
  data: PropTypes.object,
  onClick: PropTypes.func,
  timeWithDate: PropTypes.bool,
  onAction: PropTypes.func,
  actionIcon: PropTypes.string,
  actionLabel: PropTypes.string,
  onDelete: PropTypes.func,
  locked: PropTypes.bool,
};

Movement.defaultProps = {
  timeWithDate: true,
};

export default Movement;
