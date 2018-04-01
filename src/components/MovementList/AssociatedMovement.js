import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import MovementDetails from './MovementDetails';
import Action from './Action';
import {ACTION_LABELS} from './labels';

const Wrapper = styled.div`
  padding: 1em;
`;

const Label = styled.div`
  font-size: 1.2em;
  margin-bottom: 1em;
  color: ${props => props.theme.colors.main}
`;

const StyledDetails = styled(MovementDetails)`
  opacity: 0.6;
`;

const ActionsContainer = styled.div`
  margin-top: 2em;
`;

const ActionContainer = styled.div`
  margin-top: 0.8em;
  font-size: 1.2em;
`;

class AssociatedMovement extends React.PureComponent {

  constructor(props) {
    super(props);
    this.handleCreateMovement = this.handleCreateMovement.bind(this);
    this.handleLoadMovements = this.handleLoadMovements.bind(this);
  }

  render() {
    const {movementType, associatedMovement, oldestMovementDate} = this.props;

    let label;
    let text;

    if (movementType === 'departure') {
      label = 'Zugeordnete Ankunft';
      text = associatedMovement
        ? 'Die folgende Ankunft wurde diesem Abflug automatisch zugeordnet:'
        : `Es konnte keine Ankunft zugeordnet werden. Es wurden alle Bewegungen seit ${oldestMovementDate} berücksichtigt.`
    } else {
      label = 'Zugeordneter Abflug';
      text = associatedMovement
        ? 'Der folgende Abflug wurde dieser Ankunft automatisch zugeordnet:'
        : `Es konnte kein Abflug zugeordnet werden. Es wurden alle Bewegungen seit ${oldestMovementDate} berücksichtigt.`
    }

    return (
      <Wrapper>
        <div>
          <Label>{label}</Label>
          <div>{text}</div>
          {associatedMovement && <StyledDetails data={associatedMovement} isHomeBase={this.props.isHomeBase}/>}
          {!associatedMovement && (
            <ActionsContainer>
              <ActionContainer>
                <Action
                  label={ACTION_LABELS[movementType].label}
                  icon={ACTION_LABELS[movementType].icon}
                  onClick={this.handleCreateMovement}
                />
              </ActionContainer>
              <ActionContainer>
                <Action
                  label="Ältere Bewegungen laden"
                  icon={this.props.loading ? 'sync' : 'history'}
                  onClick={this.handleLoadMovements}
                  disabled={this.props.loading}
                  rotateIcon={this.props.loading ? 'left' : null}
                />
              </ActionContainer>
            </ActionsContainer>
          )}
        </div>
      </Wrapper>
    )
  }

  handleCreateMovement() {
    this.props.createMovementFromMovement(this.props.movementType, this.props.movementKey);
  }

  handleLoadMovements() {
    this.props.loadMovements();
  }
}

AssociatedMovement.propTypes = {
  movementType: PropTypes.oneOf(['departure', 'arrival']),
  movementKey: PropTypes.string.isRequired,
  isHomeBase: PropTypes.bool.isRequired,
  associatedMovement: PropTypes.object,
  oldestMovementDate: PropTypes.string.isRequired,
  loading: PropTypes.bool.isRequired,
  createMovementFromMovement: PropTypes.func.isRequired,
  loadMovements: PropTypes.func.isRequired
};

export default AssociatedMovement;
