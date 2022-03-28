import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import dates from '../../util/dates';
import Action from './Action';
import MaterialIcon from '../MaterialIcon';
import HomeBaseIcon from './HomeBaseIcon';
import {TYPE_LABELS, ACTION_LABELS} from './labels';

const ICON_HEIGHT = 30;

const Wrapper = styled.div`
  padding: 1em;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  ${props => props.selected && `
    font-weight: bold;
  `}
  ${props => props.locked && `color: #555;`}
  ${props => !props.hasAssociatedMovement && `
    font-weight: bold;
  `}

  .type {
    width: 50px;
  }

  .immatriculation {
    width: 70px;
    padding-right: 10px;
  }

  .homebase {
    flex: 0.5;
  }

  .pilot, .datetime, .location {
    flex: 1;
    padding-right: 10px;
  }

  .delete {
    width: 110px;
  }

  .action {
    width: 200px;
  }

  .pilot, .location {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  @media (max-width: 980px) {
    .action, .delete {
      width: 40px;
      text-align: center;
    }
  }

  @media (max-width: 600px) {
    .location {
      display: none;
    }
  }

  @media (max-width: 480px) {
    padding: 1em 0.5em;

    .type {
      width: 40px;
    }

    .immatriculation {
      flex: 1;
    }

    .homebase {
      display: none;
    }

    .action, .delete {
      width: 30px;
    }
  }
`;

const Column = styled.div`
  display: inline-block;
  vertical-align: top;
  width: ${props => props.width};
  ${props => props.alignMiddle && `line-height: ${ICON_HEIGHT}px;`}
  ${props => props.highlight && `color: ${props.theme.colors.main};`}
`;

const ActionColumn = styled(Column)`
  font-size: 1.2em;
`;

const Date = styled.div`
  margin-bottom: 0.2em;
`;

const getLocation = data => {
  if (data.location.toUpperCase() === __CONF__.aerodrome.ICAO) {
    if (data.departureRoute === 'circuits' || data.arrivalRoute === 'circuits') {
      return 'Platzrunden';
    }
    return 'Lokalflug';
  }
  return data.location;
};


class MovementHeader extends React.PureComponent {

  constructor(props) {
    super(props);
    this.handleActionClick = this.handleActionClick.bind(this);
    this.handleDeleteClick = this.handleDeleteClick.bind(this);
  }

  render() {
    const props = this.props;

    const date = props.timeWithDate === true
      ? dates.formatDate(props.data.date)
      : null;
    const time = dates.formatTime(props.data.date, props.data.time);

    return (
      <Wrapper
        onClick={props.onClick}
        selected={props.selected}
        locked={props.locked}
        hasAssociatedMovement={!!props.associatedMovement}
      >
        <Column className="type">
          <MaterialIcon
            icon={TYPE_LABELS[props.data.type].icon}
            size={ICON_HEIGHT}
            title={TYPE_LABELS[props.data.type].label}
          />
        </Column>
        <Column className="immatriculation" alignMiddle>{props.data.immatriculation}</Column>
        <Column className="homebase" alignMiddle>
          <HomeBaseIcon isHomeBase={props.isHomeBase}/>
        </Column>
        <Column className="pilot" alignMiddle>{props.data.lastname}</Column>
        <Column className="datetime" alignMiddle={!date}>
          {date && <Date className="date">{date}</Date>}
          <div className="time">{time}</div>
        </Column>
        <Column className="location" alignMiddle>{getLocation(props.data)}</Column>
        <ActionColumn className="action" alignMiddle highlight>
          {props.associatedMovement === null ? (
            <Action
              label={ACTION_LABELS[props.data.type].label}
              icon={ACTION_LABELS[props.data.type].icon}
              onClick={this.handleActionClick}
              responsive
            />
          ) : props.associatedMovement === undefined
            ? <MaterialIcon icon="sync" rotate="left"/>
            : null
          }
        </ActionColumn>
        <ActionColumn className="delete" alignMiddle>
          {!props.locked && (
            <Action
              label="Löschen"
              icon="delete"
              onClick={this.handleDeleteClick}
              responsive
            />
          )}
        </ActionColumn>
      </Wrapper>
    );
  }

  handleActionClick() {
    this.props.createMovementFromMovement(this.props.data.type, this.props.data.key);
  }

  handleDeleteClick() {
    this.props.onDelete(this.props.data);
  }
}

MovementHeader.propTypes = {
  data: PropTypes.object.isRequired,
  selected: PropTypes.bool,
  createMovementFromMovement: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  locked: PropTypes.bool,
  onClick: PropTypes.func,
  associatedMovement: PropTypes.object,
  isHomeBase: PropTypes.bool.isRequired
};

export default MovementHeader;
