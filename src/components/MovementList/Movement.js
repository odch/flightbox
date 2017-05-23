import React, {PropTypes} from 'react';
import styled from 'styled-components';
import MovementHeader from './MovementHeader';
import MovementDetails from './MovementDetails';
import AssociatedMovement from './AssociatedMovement';
import Action from './Action';

const Wrapper = styled.div`
  background-color: #fbfbfb;
  box-shadow: 0 -1px 0 #e0e0e0, 0 0 2px rgba(0,0,0,.12), 0 2px 4px rgba(0,0,0,.24);
  
  ${props => props.selected && `
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
`;

class Movement extends React.PureComponent {

  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
    this.handleDeleteClick = this.handleDeleteClick.bind(this);
    this.handleEditClick = this.handleEditClick.bind(this);
  }

  getAssociatedMovement(movementType, isHomeBase, preceding, subsequent) {
    if (movementType === 'departure') {
      if (isHomeBase) {
        if (subsequent && subsequent.type === 'arrival') {
          return subsequent;
        }
      } else {
        if (preceding && preceding.type === 'arrival') {
          return preceding;
        }
      }
    } else if (movementType === 'arrival') {
      if (isHomeBase) {
        if (preceding && preceding.type === 'departure') {
          return preceding;
        }
      } else {
        if (subsequent && subsequent.type === 'departure') {
          return subsequent;
        }
      }
    }
    return null;
  }

  render() {
    const props = this.props;

    const isHomeBase = props.aircraftSettings.club[props.data.immatriculation] === true
      || props.aircraftSettings.homeBase[props.data.immatriculation] === true;

    const associatedMovement = this.getAssociatedMovement(
      props.data.type,
      isHomeBase,
      props.preceding,
      props.subsequent
    );

    return (
      <Wrapper selected={props.selected}>
        <MovementHeader
          onClick={this.handleClick}
          selected={props.selected}
          data={props.data}
          timeWithDate={props.timeWithDate}
          createMovementFromMovement={props.createMovementFromMovement}
          onDelete={props.onDelete}
          locked={props.locked}
          hasAssociatedMovement={!!associatedMovement}
          isHomeBase={isHomeBase}
        />
        {props.selected && (
          <div>
            <StyledMovementDetails
              data={props.data}
              associations={props.associations}
              locked={props.locked}
              isHomeBase={isHomeBase}
            />
            {!props.locked && (
              <Footer>
                <Action
                  label="Bearbeiten"
                  icon="edit"
                  onClick={this.handleEditClick}
                />
              </Footer>
            )}
            <AssociatedMovement
              movementType={props.data.type}
              movementKey={props.data.key}
              isHomeBase={isHomeBase}
              oldestMovementDate={props.oldestMovementDate}
              associatedMovement={associatedMovement}
              createMovementFromMovement={props.createMovementFromMovement}
              loadMovements={props.loadMovements}
              loading={props.loading}
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

  handleDeleteClick(e) {
    e.stopPropagation(); // prevent call of onClick handler
    this.props.onDelete(this.props.data);
  }

  handleEditClick() {
    this.props.onEdit(this.props.data.type, this.props.data.key);
  }
}

Movement.propTypes = {
  data: PropTypes.object.isRequired,
  preceding: PropTypes.object,
  subsequent: PropTypes.object,
  selected: PropTypes.bool,
  onEdit: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  timeWithDate: PropTypes.bool,
  createMovementFromMovement: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  locked: PropTypes.bool,
  aircraftSettings: PropTypes.shape({
    club: PropTypes.objectOf(PropTypes.bool),
    homeBase: PropTypes.objectOf(PropTypes.bool)
  }).isRequired,
  oldestMovementDate: PropTypes.string.isRequired,
  loadMovements: React.PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired
};

Movement.defaultProps = {
  timeWithDate: true,
};

export default Movement;
