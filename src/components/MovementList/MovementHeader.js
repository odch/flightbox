import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import dates from '../../util/dates';
import Action from './Action';
import MaterialIcon from '../MaterialIcon';
import HomeBaseIcon from './HomeBaseIcon';
import {ACTION_LABELS, TYPE_LABELS} from './labels';
import NoPaymentTag from './NoPaymentTag'
import AircraftTypeIcon from '../AircraftTypeIcon'
import {formatLocationDisplay} from '../../util/locationDisplay'

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
  ${props => props.$selected && `
    font-weight: bold;
  `}
  ${props => props.$locked && `color: #555;`}
  ${props => !props.$hasAssociatedMovement && `
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
    width: 50px;
  }

  .aircraftType {
    flex: 0.5;
    padding-right: 10px;
  }

  .pilot, .datetime, .location {
    flex: 1;
    padding-right: 10px;
  }

  .action {
    width: 200px;
    text-align: right;
  }

  .pilot, .location {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  @media (max-width: 1200px) {
    .action {
      width: 40px;
    }
  }

  @media (max-width: 980px) {
    .aircraftType {
      display: none;
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

    .action {
      width: 30px;
    }
  }
`;

const Column = styled.div`
  display: inline-block;
  vertical-align: top;
  width: ${props => props.$width};
  ${props => props.$alignMiddle && `line-height: ${ICON_HEIGHT}px;`}
  ${props => props.$highlight && `color: ${props.theme.colors.main};`}
`;

const ActionColumn = styled(Column)`
  font-size: 1.2em;
`;

const StyledMovementTypeIcon = styled(MaterialIcon)`
  ${props => props.$locked && `
    opacity: 0.5;
  `}
`

const StyledLockIcon = styled(MaterialIcon)`
  position: absolute;
  bottom: -8px;
  right: -8px;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  padding: 1px;
  color: #666;
`

class MovementHeader extends React.PureComponent {

  constructor(props) {
    super(props);
    this.handleActionClick = this.handleActionClick.bind(this);
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
      && (!props.data.paymentMethod || props.data.paymentMethod.status === 'pending')
    const hasTags = paymentMissing

    return (
      <Wrapper
        onClick={props.onClick}
        selected={props.selected}
        $locked={props.locked}>
        <ColumnsWrapper
          $hasAssociatedMovement={
            props.data.associatedMovement
            && ['departure', 'arrival'].includes(props.data.associatedMovement.type)
          }
        >
          <Column className="type">
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <StyledMovementTypeIcon
                icon={TYPE_LABELS[props.data.type].icon}
                size={ICON_HEIGHT}
                title={TYPE_LABELS[props.data.type].label}
                $locked={props.locked}
              />
              {props.locked && (
                <StyledLockIcon
                  icon="lock"
                  size={14}
                  title="Diese Bewegung kann nicht mehr bearbeitet oder gelöscht werden"
                />
              )}
            </div>
          </Column>
          <Column className="immatriculation" $alignMiddle>{props.data.immatriculation}</Column>
          <Column className="homebase" $alignMiddle>
            <HomeBaseIcon isHomeBase={props.isHomeBase}/>
          </Column>
          <Column className="aircraftType" $alignMiddle>
            <AircraftTypeIcon aircraftCategory={props.data.aircraftCategory} mtow={props.data.mtow}/>
          </Column>
          <Column className="pilot" $alignMiddle>{props.data.lastname}</Column>
          <Column className="datetime" $alignMiddle>
            {date ? (<div style={{lineHeight: '1.1'}}>
              <div style={{fontSize: '0.90em', color: '#666'}}>{date}</div>
              <div>{time}</div>
            </div>) : (
              <div>
                <div>{time}</div>
              </div>
            )}
          </Column>
          <Column className="location" $alignMiddle>{formatLocationDisplay(props.data)}</Column>
          <ActionColumn className="action" $alignMiddle $highlight>
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
}

MovementHeader.propTypes = {
  data: PropTypes.object.isRequired,
  selected: PropTypes.bool,
  createMovementFromMovement: PropTypes.func.isRequired,
  locked: PropTypes.bool,
  onClick: PropTypes.func,
  isHomeBase: PropTypes.bool.isRequired,
  isAdmin: PropTypes.bool.isRequired
};

export default MovementHeader;
