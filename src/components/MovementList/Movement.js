import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import dates from '../../util/dates';
import MovementHeader from './MovementHeader';
import MovementDetails from './MovementDetails';
import AssociatedMovement from '../../containers/AssociatedMovementContainer';
import Action from './Action';

const Wrapper = styled.div`
  background-color: #fbfbfb;
  box-shadow: 0 -1px 0 #e0e0e0, 0 0 2px rgba(0,0,0,.12), 0 2px 4px rgba(0,0,0,.24);

  ${props => props.$selected && `
    margin: 20px -10px 20px -10px;

    @media (max-width: 768px) {
      margin: 10px -3px 10px -3px;
    }
  `}
`;

const StyledMovementDetails = styled(MovementDetails)`
  background-color: #fff;
`;

const Footer = styled.div`
  background-color: #fff;
  text-align: right;
  padding-right: 0.7em;
  padding-bottom: 0.7em;
  font-size: 1.3em;
  display: flex;
  gap: 25px;
  justify-content: end;

  @media (max-width: 600px) {
    flex-direction: column;
    gap: 10px;
    align-items: center;
  }
`;

class Movement extends React.PureComponent {

  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
    this.handleDeleteClick = this.handleDeleteClick.bind(this);
    this.handleEditClick = this.handleEditClick.bind(this);
    this.handleCustomsClick = this.handleCustomsClick.bind(this);
  }

  render() {
    const props = this.props;

    const isHomeBase = props.aircraftSettings.club[props.data.immatriculation] === true
      || props.aircraftSettings.homeBase[props.data.immatriculation] === true;

    return (
      <Wrapper $selected={props.selected} data-id={props.data.key}>
        <MovementHeader
          onClick={this.handleClick}
          selected={props.selected}
          data={props.data}
          timeWithDate={props.timeWithDate}
          createMovementFromMovement={props.createMovementFromMovement}
          locked={props.locked}
          isHomeBase={isHomeBase}
          isAdmin={props.isAdmin}
        />
        {props.selected && (
          <div>
            <StyledMovementDetails
              data={props.data}
              locked={props.locked}
              isHomeBase={isHomeBase}
              isAdmin={props.isAdmin}
            />
            {!props.locked && (
              <Footer>
                {this.shouldShowCustomsAction() && (
                  <Action
                    label={props.data.customsFormId ? "Zollanmeldung öffnen" : "Zollanmeldung erfassen"}
                    icon={props.customs.loading ? "sync" :"description"}
                    rotateIcon={props.customs.loading ? 'left' : undefined}
                    disabled={props.customs.loading}
                    onClick={this.handleCustomsClick}
                  />
                )}
                <Action
                  label="Bearbeiten"
                  icon="edit"
                  onClick={this.handleEditClick}
                />
                <Action
                  label="Löschen"
                  icon="delete"
                  onClick={this.handleDeleteClick}
                />
              </Footer>
            )}
            <AssociatedMovement
              movementType={props.data.type}
              movementKey={props.data.key}
              isHomeBase={isHomeBase}
              associatedMovement={props.data.associatedMovement}
              createMovementFromMovement={props.createMovementFromMovement}
              loading={props.loading}
              isAdmin={props.isAdmin}
            />
          </div>
        )}
      </Wrapper>
    );
  }

  handleClick() {
    const selected = this.props.selected ? null : this.props.data.key;
    this.props.onSelect(selected);
  }

  handleDeleteClick() {
    this.props.onDelete(this.props.data);
  }

  handleEditClick() {
    this.props.onEdit(this.props.data.type, this.props.data.key);
  }

  handleCustomsClick() {
    this.props.onStartCustoms(this.props.data);
  }

  isForeignFlight() {
    const { data, aerodromes } = this.props;

    if (!aerodromes || !aerodromes.data) {
      return false;
    }

    const aerodrome = aerodromes.data.getByKey(data.location);

    if (!aerodrome) {
      return false;
    }

    return aerodrome.country !== 'CH';
  }

  isFutureFlightTime() {
    const { data } = this.props;
    const flightTimestamp = dates.localToIsoUtc(data.date, data.time);
    const now = new Date().toISOString();
    return flightTimestamp > now;
  }

  shouldShowCustomsAction() {
    const { data, customs } = this.props;

    // Only show customs actions if the customs declaration app is available (checked via Cloud Functions)
    if (customs && customs.available !== true) {
      return false;
    }

    // Show "Zollanmeldung öffnen" if customsFormId exists (regardless of timing)
    if (data.customsFormId) {
      return true;
    }

    // Show "Zollanmeldung erfassen" for foreign flights that are in the future
    return this.isForeignFlight() && this.isFutureFlightTime();
  }
}

Movement.propTypes = {
  data: PropTypes.object.isRequired,
  selected: PropTypes.bool,
  customs: PropTypes.shape({
    loading: PropTypes.bool,
    success: PropTypes.bool
  }).isRequired,
  aerodromes: PropTypes.shape({
    data: PropTypes.object
  }),
  onEdit: PropTypes.func.isRequired,
  onStartCustoms: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  timeWithDate: PropTypes.bool,
  createMovementFromMovement: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  locked: PropTypes.bool,
  aircraftSettings: PropTypes.shape({
    club: PropTypes.objectOf(PropTypes.bool),
    homeBase: PropTypes.objectOf(PropTypes.bool)
  }).isRequired,
  loading: PropTypes.bool.isRequired
};

Movement.defaultProps = {
  timeWithDate: true,
};

export default Movement;
