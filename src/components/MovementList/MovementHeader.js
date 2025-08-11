import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import dates from '../../util/dates';
import Action from './Action';
import MaterialIcon from '../MaterialIcon';
import HomeBaseIcon from './HomeBaseIcon';
import {ACTION_LABELS, TYPE_LABELS} from './labels';
import NoPaymentTag from './NoPaymentTag'

const ICON_HEIGHT = 30;

const TagsWrapper = styled.div`
  padding: 0 1em 0.5em 1em;
  display: flex;
`

const Wrapper = styled.div`
  cursor: pointer;
`

const ColumnsWrapper = styled.div`
  padding: 1em;
  overflow: hidden;
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

    const showPayment = (props.isHomeBase === false || __CONF__.homebasePayment)
    const paymentMissing = showPayment
      && props.data.type === 'arrival'
      && props.data.landingFeeTotal !== undefined
      && !props.data.paymentMethod
    const hasTags = paymentMissing

    return (
      <Wrapper
        onClick={props.onClick}
        selected={props.selected}
        locked={props.locked}>
        <ColumnsWrapper
          hasAssociatedMovement={
            props.data.associatedMovement
            && ['departure', 'arrival'].includes(props.data.associatedMovement.type)
          }
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
            {props.data.associatedMovement && props.data.associatedMovement.type === 'none' ? (
              <Action
                label={ACTION_LABELS[props.data.type].label}
                icon={ACTION_LABELS[props.data.type].icon}
                onClick={this.handleActionClick}
                responsive
              />
            ) : props.data.associatedMovement === null
              ? <MaterialIcon icon="sync" rotate="left"/> // show rotating icon if `associatedMovement` is null (= state where the associated movement is being monitored, but not set yet)
              : null // if `associatedMovement` is undefined, we don't want to show anything (= state before the associated movement is even being monitored)
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
        </ColumnsWrapper>
        {hasTags && (
          <TagsWrapper>
            {props.isAdmin && paymentMissing && (
              <NoPaymentTag/>
            )}
          </TagsWrapper>
        )}
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
  isHomeBase: PropTypes.bool.isRequired,
  isAdmin: PropTypes.bool.isRequired
};

export default MovementHeader;
