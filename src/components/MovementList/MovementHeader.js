import React, {PropTypes} from 'react';
import styled from 'styled-components';
import dates from '../../util/dates';
import Action from './Action';
import MaterialIcon from '../MaterialIcon';

const ICON_HEIGHT = 30;

const LABELS = {
  departure: {
    label: 'Abflug',
    icon: 'flight_takeoff'
  },
  arrival: {
    label: 'Ankunft',
    icon: 'flight_land'
  }
};

const CREATE_LABELS = {
  departure: {
    label: 'Ankunft erfassen',
    icon: 'flight_land'
  },
  arrival: {
    label: 'Abflug erfassen',
    icon: 'flight_takeoff'
  }
};

const Wrapper = styled.div`
  padding: 1em;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  ${props => props.selected && `
    font-weight: bold;
  `}
  ${props => props.locked && `color: #555;`}
  
  .type {
    width: 50px;
  }
  
  .immatriculation, .pilot, .datetime, .location {
    flex: 1;
  }
  
  .delete {
    width: 110px;
  }
  
  .action {
    width: 200px;
  }
  
  .immatriculation {
    padding-right: 5px;
  }
    
  .pilot {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding-right: 5px;
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
  
  @media (max-width: 450px) {
    padding: 1em 0.5em;
    
    .type {
      width: 40px;
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
      <Wrapper onClick={props.onClick} selected={props.selected} locked={props.locked}>
        <Column className="type">
          <MaterialIcon
            icon={LABELS[props.data.type].icon}
            size={ICON_HEIGHT}
            title={LABELS[props.data.type].label}
          />
        </Column>
        <Column className="immatriculation" alignMiddle>{props.data.immatriculation}</Column>
        <Column className="pilot" alignMiddle>{props.data.lastname}</Column>
        <Column className="datetime" alignMiddle={!date}>
          {date && <Date className="date">{date}</Date>}
          <div className="time">{time}</div>
        </Column>
        <Column className="location" alignMiddle>{getLocation(props.data)}</Column>
        <ActionColumn className="action" alignMiddle>
          <Action
            label={CREATE_LABELS[props.data.type].label}
            icon={CREATE_LABELS[props.data.type].icon}
            onClick={this.handleActionClick}
          />
        </ActionColumn>
        <ActionColumn className="delete" alignMiddle>
          {!props.locked && (
            <Action
              label="Löschen"
              icon="delete"
              onClick={this.handleDeleteClick}
            />
          )}
        </ActionColumn>
      </Wrapper>
    );
  }

  handleActionClick(e) {
    e.stopPropagation(); // prevent call of onClick handler
    this.props.createMovementFromMovement(this.props.data.type, this.props.data.key);
  }

  handleDeleteClick(e) {
    e.stopPropagation(); // prevent call of onClick handler
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
};

export default MovementHeader;
