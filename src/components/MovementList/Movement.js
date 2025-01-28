import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import MovementHeader from './MovementHeader';
import MovementDetails from './MovementDetails';
import AssociatedMovement from '../../containers/AssociatedMovementContainer';
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

  render() {
    const props = this.props;

    const isHomeBase = props.aircraftSettings.club[props.data.immatriculation] === true
      || props.aircraftSettings.homeBase[props.data.immatriculation] === true;

    return (
      <Wrapper selected={props.selected} data-id={props.data.key}>
        <MovementHeader
          onClick={this.handleClick}
          selected={props.selected}
          data={props.data}
          timeWithDate={props.timeWithDate}
          createMovementFromMovement={props.createMovementFromMovement}
          onDelete={props.onDelete}
          locked={props.locked}
          isHomeBase={isHomeBase}
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
  loading: PropTypes.bool.isRequired
};

Movement.defaultProps = {
  timeWithDate: true,
};

export default Movement;
